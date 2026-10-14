# hero-banner

Custom **hero** block. 

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell of content.

## Supported variations

| Variation | Option class |
| --- | --- |
| undefined | `undefined` |

## Universal Editor fields

Add **Hero Banner** from the section's Add menu. The component uses the
`hero-banner` model with these fields:

| Field | Property | Type |
| --- | --- | --- |
| Background Image | `image` | Optional image reference |
| Image Alt Text | `imageAlt` | Text |
| Title and Content | `text` | Rich text with heading, optional subheading and links |

Use an H1 heading in Title and Content for the banner title. Leave Background
Image empty for the title-only layout. Existing AEM blocks must have a model
value of `hero-banner` to use this dialog.
