# Supabase MCP Server Integration

The Supabase MCP (Model Context Protocol) server is now configured for this project, giving you enhanced capabilities to interact with your Supabase database directly through Kiro.

---

## What is MCP?

MCP (Model Context Protocol) allows AI assistants like Kiro to interact with external services and tools. The Supabase MCP server provides direct access to your Supabase project's database and features.

---

## Configuration

The MCP server is configured in `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=qtjjelgkzafbgqpuchkr",
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

---

## Capabilities

With the Supabase MCP server, you can:

### Database Operations

- ✅ **Query tables** - Run SQL queries directly
- ✅ **View schema** - Inspect table structures
- ✅ **Manage data** - Insert, update, delete records
- ✅ **View relationships** - See foreign key relationships

### Project Management

- ✅ **Check project status** - Monitor database health
- ✅ **View metrics** - Database size, connections, etc.
- ✅ **Manage settings** - Update project configuration

### Development Tools

- ✅ **Run migrations** - Execute database migrations
- ✅ **Seed data** - Populate tables with test data
- ✅ **Backup/Restore** - Manage database backups

---

## Usage Examples

### Example 1: Query Database

You can ask Kiro:

```
"Show me all customers in the database"
"What tables exist in my Supabase project?"
"Get the latest 5 installment plans"
```

### Example 2: Manage Data

```
"Add a new customer named John Smith"
"Update the customer with ID xyz"
"Delete test data from the sales table"
```

### Example 3: Schema Operations

```
"Show me the structure of the installments table"
"What are the relationships between sales and customers?"
"List all indexes on the payments table"
```

---

## How It Works

1. **Kiro connects** to the Supabase MCP server
2. **MCP server** authenticates with your Supabase project
3. **Operations** are executed securely on your database
4. **Results** are returned to Kiro and displayed to you

---

## Security

- ✅ **Secure connection** - HTTPS only
- ✅ **Project-specific** - Only accesses your project (qtjjelgkzafbgqpuchkr)
- ✅ **Read/Write access** - Full database capabilities
- ⚠️ **Be careful** - MCP has direct database access

---

## Reconnecting MCP Server

If you need to reconnect the MCP server:

### Option 1: Kiro UI

1. Open Kiro feature panel
2. Go to "MCP Server" view
3. Find "supabase" server
4. Click "Reconnect"

### Option 2: Command Palette

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "MCP"
3. Select "Reconnect MCP Servers"

### Option 3: Restart Kiro

Simply restart Kiro IDE to reconnect all MCP servers.

---

## Disabling MCP Server

If you want to disable the Supabase MCP server:

Edit `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=qtjjelgkzafbgqpuchkr",
      "disabled": true, // ← Change to true
      "autoApprove": []
    }
  }
}
```

---

## Auto-Approve Tools

To automatically approve certain MCP operations without prompts, add them to `autoApprove`:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=qtjjelgkzafbgqpuchkr",
      "disabled": false,
      "autoApprove": ["query_database", "list_tables", "get_schema"]
    }
  }
}
```

**Warning**: Only auto-approve read-only operations you trust!

---

## Troubleshooting

### MCP Server Not Connecting

1. **Check internet connection** - MCP requires internet access
2. **Verify project ref** - Ensure `qtjjelgkzafbgqpuchkr` is correct
3. **Check Supabase status** - Visit https://status.supabase.com
4. **Restart Kiro** - Sometimes a restart helps

### MCP Operations Failing

1. **Check Supabase project** - Ensure it's not paused
2. **Verify permissions** - Check database access settings
3. **Review error messages** - MCP provides detailed errors
4. **Check logs** - View Kiro logs for MCP errors

### MCP Server Slow

1. **Check Supabase region** - Distance affects latency
2. **Database size** - Large databases take longer to query
3. **Network speed** - Slow internet affects MCP performance

---

## Benefits of MCP Integration

### For Development

- ✅ **Faster queries** - No need to open Supabase dashboard
- ✅ **Context-aware** - Kiro understands your schema
- ✅ **Integrated workflow** - Database operations in your IDE
- ✅ **Natural language** - Ask questions in plain English

### For Debugging

- ✅ **Quick inspection** - Check data without leaving IDE
- ✅ **Schema exploration** - Understand relationships easily
- ✅ **Data validation** - Verify migrations and seeds
- ✅ **Error investigation** - Query logs and data directly

### For Productivity

- ✅ **Less context switching** - Stay in Kiro
- ✅ **Faster iterations** - Test queries immediately
- ✅ **Better insights** - AI-powered data analysis
- ✅ **Automated tasks** - Let Kiro handle routine queries

---

## Example Workflows

### Workflow 1: Check Seeded Data

```
You: "Show me all users in the database"
Kiro: [Queries via MCP and shows results]

You: "How many customers do we have?"
Kiro: [Counts customers and reports]
```

### Workflow 2: Debug Migration

```
You: "What tables were created by the last migration?"
Kiro: [Lists tables and their structures]

You: "Show me the schema for installment_plans"
Kiro: [Displays columns, types, and relationships]
```

### Workflow 3: Data Validation

```
You: "Are there any sales without customers?"
Kiro: [Runs query to check referential integrity]

You: "Show me installments due this month"
Kiro: [Queries with date filters]
```

---

## Comparison: MCP vs Manual Methods

| Task               | Without MCP                                      | With MCP                     |
| ------------------ | ------------------------------------------------ | ---------------------------- |
| Query data         | Open Supabase dashboard → SQL editor → Run query | Ask Kiro in natural language |
| Check schema       | Dashboard → Table editor → Click table           | "Show me the schema for X"   |
| Count records      | Write SQL → Execute → Read result                | "How many X do we have?"     |
| Find relationships | Manually inspect foreign keys                    | "What's related to X?"       |
| Debug data         | Multiple dashboard tabs                          | Ask questions in chat        |

---

## Best Practices

### Do's ✅

- ✅ Use MCP for quick queries and inspections
- ✅ Ask natural language questions
- ✅ Verify results before making changes
- ✅ Use MCP for development and debugging
- ✅ Keep MCP config in version control

### Don'ts ❌

- ❌ Don't auto-approve destructive operations
- ❌ Don't share MCP config with sensitive data
- ❌ Don't rely solely on MCP for production operations
- ❌ Don't bypass proper migration workflows
- ❌ Don't use MCP for bulk operations (use Prisma instead)

---

## Alternative Tools

While MCP is powerful, you still have other options:

### Prisma Studio

```bash
cd backend
npx prisma studio
```

- Local GUI for database
- Works with any Prisma-compatible database
- Full CRUD operations

### Supabase Dashboard

- https://supabase.com/dashboard/project/qtjjelgkzafbgqpuchkr
- Full project management
- SQL editor, table editor, monitoring

### psql (Command Line)

```bash
psql "postgresql://postgres:password@db.qtjjelgkzafbgqpuchkr.supabase.co:5432/postgres"
```

- Direct PostgreSQL access
- Full SQL capabilities
- Scriptable

---

## Learn More

- **MCP Documentation**: https://modelcontextprotocol.io/
- **Supabase MCP**: https://supabase.com/docs/guides/ai/mcp
- **Kiro MCP Guide**: Check Kiro documentation for MCP features

---

## Summary

✅ **Supabase MCP server configured**  
✅ **Direct database access from Kiro**  
✅ **Natural language queries enabled**  
✅ **Enhanced development workflow**  
✅ **Secure and project-specific**

You can now interact with your Supabase database directly through Kiro using natural language! Try asking questions about your database schema, data, or running queries.

---

**Example to try right now:**

Ask Kiro: _"Show me all tables in my Supabase database"_

The MCP server will query your database and show you the results! 🚀
