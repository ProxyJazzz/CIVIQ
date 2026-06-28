#!/usr/bin/env node
process.env.SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';
import('../node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js');
