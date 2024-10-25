# Membership check

The Membership Check feature verifies JavaBin membership by looking up whether the user had a ticket for JavaZone.
The user submits their email, which must match the one used for JavaZone registration. Upon submission, they will
receive an email with information regarding their membership status.

## Implementation Details:

### Input:

The user is prompted to provide their email, the same one they used for registering at JavaZone.
A CAPTCHA will be implemented to prevent bots or automated requests from spamming the system.

#### Membership Lookup:

Once the email is provided, the system queries the Checkin service to determine if the email is associated with a
JavaZone ticket that grants them ownership. (This will be the JavaZone event held leading up to the next årsmøte)
An email will be sent to the provided address with the membership information.

#### Email Notification:

The notification will include:

- The membership status.
- A contact email for if the information is incorrect, or they have questions.
- A link to purchase a JavaBin membership if none is found.

#### CAPTCHA:

Implementing a CAPTCHA to prevent abuse of the email input field will reduce the chance of spam or misuse by bots.

#### Support:

Include a support email in the notification for users to contact in case the information provided doesn’t match their
expectations or if they need further assistance.

#### Link to Purchase:

The notification email should provide a direct link where the user can purchase or renew a membership if they are not
currently registered.

#### Privacy Considerations:

Membership information is private, so we only notify the email address provided, and only lookup based on that email.
This ensures you can only check membership status for emails you own.

#### Alternative Approach (Optional):

Instead of emailing the membership status, we could implement an email magic link for authentication.
After clicking the link, the user could see their membership status directly on the webpage.



