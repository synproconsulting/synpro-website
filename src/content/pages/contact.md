---
title: Start a conversation
seoTitle: Contact — SynPro Consulting
seoDescription: >-
  Tell me what you're working on. If I can help, I'll say so and suggest how. Independent facilities
  and workplace technology advisory, based in Houston, Texas.
intro:
  - >-
    Tell me what you're working on. If I can help, I'll say so and suggest how. If I can't, I'll tell
    you that too — and where possible, point you somewhere better.
  - I read every message myself.
# ---------------------------------------------------------------------------
# SPECIFICATION as well as copy. The Worker built in a later sprint validates
# against exactly these values and returns exactly these messages. Changing a
# string here changes the contract with that Worker.
# ---------------------------------------------------------------------------
form:
  fields:
    - name: name
      label: Your name
      type: text
      required: true
    - name: company
      label: Company or organisation
      type: text
      required: false
    - name: email
      label: Email address
      type: email
      required: true
    - name: enquiryType
      label: What's this about?
      type: select
      required: true
    - name: message
      label: What are you working on?
      placeholder: A sentence or two is plenty to start.
      type: textarea
      required: true
  enquiryTypes:
    - Facilities services sourcing
    - Facilities services assessment or improvement
    - Workplace or maintenance technology
    - Something else
  submitLabel: Send message
  messages:
    success: Thanks — your message has been sent. I'll come back to you shortly.
    failure: Sorry — your message couldn't be sent. Please try again, or email me directly.
  validation:
    nameEmpty: Please enter your name.
    emailEmpty: Please enter an email address.
    emailMalformed: That doesn't look like a valid email address.
    enquiryEmpty: Please choose what this is about.
    messageEmpty: Please tell me a little about what you're working on.
    messageTooLong: That's longer than the form accepts — please shorten it, or email me directly.
  # No limit is specified in the draft; the draft asks for something generous.
  # DRAFTED, not owner-approved — the Worker ticket should confirm it.
  messageMaxLength: 4000
email: info@synproconsulting.co
linkedin:
  label: linkedin.com/in/askjohan
  href: https://www.linkedin.com/in/askjohan/
---

## Location

I'm based in **Houston, Texas**. Engagements are delivered nationally and remotely.

## What happens to your details

Your message comes to me by email and nowhere else. I don't run analytics on this site, I don't
add anyone to a mailing list, and I don't pass details to third parties.
