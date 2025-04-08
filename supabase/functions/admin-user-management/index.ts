import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400'
}

const ADMIN_EMAIL = 'balaramakrishnasaikarumanchi0@gmail.com'

// Helper to invoke other functions (requires service role key)
const invokeFunction = async (functionName: string, body: object) => {
  // Use a dedicated service role client for invoking functions
  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const { data, error } = await supabaseService.functions.invoke(functionName, {
    body: JSON.stringify(body)
  });

  if (error) {
    console.error(`Error invoking ${functionName}:`, error);
    // Log and continue
  }
  return { data, error };
};

serve(async (req) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  console.log("Request Headers:", Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log("Responding to OPTIONS request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    // 1. Get request details
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    let body;
    try {
      body = await req.json();
      console.log("Parsed Request Body:", body);
    } catch (parseError) {
      console.error("Error parsing request body as JSON:", parseError);
      throw new Error(`Failed to parse request body as JSON. Error: ${parseError.message}`);
    }
    
    const { action, userId, email } = body;
    if (!action || !userId || !email) {
      throw new Error('Missing required fields in request body (action, userId, email)');
    }

    // 2. Verify Admin using a client scoped to the request's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', // Use anon key here
      {
        global: {
          headers: { Authorization: authHeader },
        }
      }
    )
    const { data: { user: adminUser }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !adminUser || adminUser.email !== ADMIN_EMAIL) {
      console.error('Admin verification failed:', authError, adminUser?.email);
      throw new Error('Unauthorized');
    }
    console.log("Admin user verified:", adminUser.email);

    // 3. Perform actions using a dedicated Service Role Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      // No global headers needed for service role actions
    );

    let result;
    switch (action) {
      case 'delete':
        console.log(`Attempting to delete user ID: ${userId} (Initiated by ${adminUser.email})`);
        
        // Prevent admin from deleting themselves
        if (adminUser.id === userId) {
           throw new Error('Admin user cannot delete themselves.');
        }

        // Delete from auth.users using Service Role
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError && deleteError.message !== 'User not found') {
          console.error("Error deleting from auth.users:", deleteError);
          throw deleteError; // Re-throw actual error
        }
        console.log("Deleted/verified deleted from auth.users successfully");
        
        // Delete from pending_users using Service Role
        const { error: pendingError } = await supabaseAdmin
          .from('pending_users')
          .delete()
          .eq('id', userId);
        if (pendingError) {
          console.error("Error deleting from pending_users:", pendingError);
          throw pendingError; // Re-throw actual error
        }
        console.log("Deleted from pending_users successfully");
        
        result = { message: 'User deleted successfully' };
        // No email sent on manual deletion
        break;

      case 'approve':
        console.log(`Attempting to approve user ID: ${userId} (Initiated by ${adminUser.email})`);
        // Update pending_users status using Service Role
        const { error: approveError } = await supabaseAdmin
          .from('pending_users')
          .update({ status: 'approved' })
          .eq('id', userId);
        if (approveError) {
          console.error("Error approving user in pending_users:", approveError);
          throw approveError;
        }
        console.log("User approved successfully in pending_users");

        // Invoke approval email function
        await invokeFunction('send-approval-email', { userEmail: email });
        
        result = { message: 'User approved successfully' };
        break;

      case 'reject':
        console.log(`Attempting to reject user ID: ${userId} (Initiated by ${adminUser.email})`);

         // Prevent admin from rejecting themselves (shouldn't happen in practice but good check)
         if (adminUser.id === userId) {
          throw new Error('Admin user cannot reject themselves.');
       }

        // Update pending_users status using Service Role
        const { error: rejectError } = await supabaseAdmin
          .from('pending_users')
          .update({ status: 'rejected' })
          .eq('id', userId);
        if (rejectError) {
          console.error("Error rejecting user in pending_users:", rejectError);
          throw rejectError;
        }
        console.log("User rejected successfully in pending_users");
        
        // Delete from auth.users using Service Role
        const { error: rejectDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (rejectDeleteError && rejectDeleteError.message !== 'User not found') { 
          console.error("Error deleting rejected user from auth.users:", rejectDeleteError);
          throw rejectDeleteError;
        }
        console.log("Deleted rejected user from auth.users successfully");
        
        // Invoke rejection email function
        await invokeFunction('send-rejection-email', { userEmail: email });

        result = { message: 'User rejected successfully' };
        break;

      default:
        console.error("Invalid action received:", action);
        throw new Error('Invalid action');
    }

    console.log("Action successful:", result.message);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Function error:', error);
    const errorMessage = (error instanceof Error) ? error.message : JSON.stringify(error);
    // Determine status code based on specific errors we throw
    let statusCode = 400;
    if (errorMessage === 'Unauthorized' || errorMessage === 'Admin user cannot delete themselves.' || errorMessage === 'Admin user cannot reject themselves.') {
        statusCode = 403; // Forbidden might be more appropriate here
    } else if (errorMessage === 'Missing authorization header') {
        statusCode = 401;
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}) 