# Ditto - The Only Platform to Manage Your Job Application

Ditto is a all in one solution for people that applies to many different position in many different companies.
We will have a Dashboard to have a overview of your applications, interviews, and all the document you used for those applications.

# Pages

## Login Page

- User can login to their own account
- User can be redirect to the registration page when they don't have a account
- User will be redirect to the home page (dashboard page) after successful login
- User can find their password when they forget it
- User can reset their password when they want to

## Register Page

- User can create a new account
- User will know the restriction for each field clearly
- User will be redirect and keep login status after they create an account
- User can be redirect to the login page if they already have an account

## Dashboard Page

- User can see the up-coming events (interviews)
- User can see the application summary
  - How many applications in each status
- User can see the interview summary
  - How many interviews in each stage

## Applications Page

- User can see the applications applied in a table view default sorted in applied time
  - For each application, user will need to see:
    - Company name
    - Position name
    - Application status
    - Position location
    - Apply date
    - Application tags (TBD)
    - Job Post Url
    - Application Documents (resume, cover letter, note)
    - Edit and Delete button
- User can click a `New Application` button that redirect to a create application form
- User can click on specific row to enter the detail page of the application
- User can click the `edit icon` that redirect user to the edit application form
- User can click the `delete icon` to delete a application after confirm
- User can see a quick summary at the bottom of the page
- User can sort applications base on the column they choose
- User can filter applications base on the column they choose
- User can sort and filter at the same time

## Interviews Pages

- User can see interviews group by application in a table view sorted in closest interview
  - For each interview, user will see:
    - Which application this interview belong
    - Interview time
    - Interviewer / Interviewer's link (Linkedin etc.)
    - Preparation Note
    - Review Note
- User can click a `New Interview` button that redirect to a create interview form
- User can click on specific row to enter the detail page of the application
- User can click the `edit icon` that redirect user to the edit interview form
- User can click the `delete icon` to delete a interview after confirm
- User can see a quick summary at the bottom of the page
- User can sort interview base on the column they choose
- User can filter interview base on the column they choose
- User can sort and filter at the same time

## Application Detail Page

- User can see two sections of the applications - application and interview
- User can see application detail in the application section
  - Company name
  - Position name
  - Application status
  - Position location
  - Apply date
  - Application tags (TBD)
  - Job Post Url
  - Application Documents (resume, cover letter, note)
- User can see interviews in the order of time in the interview section
  - Each interview contains:
    - Interview time
    - Interviewer / Interviewer's link (Linkedin etc.)
    - Preparation Note
    - Review Note
- User will see the upcoming event (interview, deadline)
- User can edit the application section, and it will sync to the applications table
- User can edit the interview section, and it will sync to the interviews table
- User can create new interview
- User can delete interview
- User can delete applications, and all the interview related to this application will also be deleted
