import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { notionToken, databaseId, title, content } = await req.json();

    if (!notionToken || !databaseId) {
      return NextResponse.json(
        { error: 'Missing Notion Token or Target ID.' },
        { status: 400 }
      );
    }

    // Split content line by line and map to native Notion blocks
    const lines = (content || '').split('\n');
    const children: any[] = [];
    let inCodeBlock = false;
    let codeText = '';

    for (const line of lines) {
      const trimmed = line.trim();

      // Parse code block tags
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          children.push({
            object: 'block',
            type: 'code',
            code: {
              rich_text: [{ type: 'text', text: { content: codeText } }],
              language: 'javascript'
            }
          });
          codeText = '';
        } else {
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeText += line + '\n';
        continue;
      }

      if (line.startsWith('# ')) {
        children.push({
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
          }
        });
      } else if (line.startsWith('## ')) {
        children.push({
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: line.slice(3) } }]
          }
        });
      } else if (line.startsWith('- [ ] ') || line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
        const checked = line.startsWith('- [x] ') || line.startsWith('- [X] ');
        const todoText = line.slice(6);
        children.push({
          object: 'block',
          type: 'to_do',
          to_do: {
            rich_text: [{ type: 'text', text: { content: todoText } }],
            checked
          }
        });
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        children.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
          }
        });
      } else if (line.startsWith('> ')) {
        children.push({
          object: 'block',
          type: 'quote',
          quote: {
            rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
          }
        });
      } else if (trimmed) {
        children.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: line } }]
          }
        });
      }
    }

    // Limit block count to stay within Notion's initial limits if massive
    const slicedChildren = children.slice(0, 95);

    // Try Database parent layout first
    let response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: title || 'Untitled Page'
                }
              }
            ]
          }
        },
        children: slicedChildren
      })
    });

    let resData = await response.json();

    // If database page creation fails, try page parent layout fallback
    if (!response.ok) {
      console.warn("Database sync failed, falling back to parent page sync:", resData);

      response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parent: { page_id: databaseId },
          properties: {
            title: [
              {
                text: {
                  content: title || 'Untitled Page'
                }
              }
            ]
          },
          children: slicedChildren
        })
      });

      resData = await response.json();
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: resData.message || 'Failed to sync to Notion.' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      url: resData.url,
      pageId: resData.id
    });

  } catch (err: any) {
    console.error('Notion Sync Endpoint Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
