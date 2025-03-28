-- Create documentation table
CREATE TABLE IF NOT EXISTS documentation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    order_number INTEGER NOT NULL,
    parent_id UUID REFERENCES documentation(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add RLS policies
ALTER TABLE documentation ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to authenticated users"
    ON documentation
    FOR SELECT
    TO authenticated
    USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_documentation_updated_at
    BEFORE UPDATE ON documentation
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial documentation
INSERT INTO documentation (title, content, order_number) VALUES
('Getting Started', '# Getting Started with ProgramMatrix

Welcome to ProgramMatrix documentation! This guide will help you understand how to use our platform effectively.

## Overview

ProgramMatrix is a comprehensive program management solution that helps you:
- Track program progress
- Manage risks
- Optimize resource allocation
- Generate insights

## Quick Start

1. Log in to your account
2. Navigate to the dashboard
3. Create your first program
4. Add team members
5. Start tracking progress

For more detailed information, check out our other documentation sections.', 1),

('Program Management', '# Program Management

Learn how to effectively manage your programs using ProgramMatrix.

## Creating a Program

To create a new program:
1. Click the "New Program" button
2. Fill in the program details
3. Set up your timeline
4. Define key metrics
5. Add team members

## Program Dashboard

The program dashboard provides:
- Overview of program status
- Key metrics and KPIs
- Risk indicators
- Resource allocation
- Timeline progress', 2),

('Risk Management', '# Risk Management

Understand how to identify, assess, and mitigate risks in your programs.

## Risk Assessment

Our AI-powered risk assessment helps you:
- Identify potential risks
- Evaluate impact and probability
- Generate mitigation strategies
- Track risk status

## Risk Monitoring

ProgramMatrix provides real-time risk monitoring:
- Automated risk detection
- Early warning system
- Impact analysis
- Mitigation tracking', 3);

-- Add some child sections
INSERT INTO documentation (title, content, order_number, parent_id)
SELECT 'User Management', '# User Management

Learn how to manage users and permissions in your organization.

## Adding Users

To add new users:
1. Navigate to Settings
2. Click on "Users"
3. Click "Invite User"
4. Enter email and role
5. Send invitation

## User Roles

ProgramMatrix supports multiple user roles:
- Admin
- Program Manager
- Team Member
- Viewer', 4, id
FROM documentation
WHERE title = 'Getting Started';

INSERT INTO documentation (title, content, order_number, parent_id)
SELECT 'Resource Planning', '# Resource Planning

Optimize your resource allocation with our advanced planning tools.

## Resource Dashboard

The resource dashboard shows:
- Resource availability
- Allocation status
- Utilization metrics
- Capacity planning

## Resource Assignment

To assign resources:
1. Open the resource planner
2. Select a program
3. Choose resources
4. Set allocation percentage
5. Save changes', 5, id
FROM documentation
WHERE title = 'Program Management'; 