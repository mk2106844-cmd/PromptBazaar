# PromptBazaar SQL Migration Instructions

## 1. Context
The frontend currently falls back to the "Prompt text ready." or "Masterpiece..." placeholders because the Supabase RPC functions (`get_unlocked_photo_secret`, `get_unlocked_video_secret`, `get_anon_orders`) exist in your database with mismatched parameter names (e.g., `anon_user_id` instead of `p_anon_user_id`). This throws a `PGRST202` schema cache error and causes the frontend to fail to fetch the prompt.

## 2. Steps to Apply the Migration
1. Open the file `sql_migration.sql` that was just generated in the repository root.
2. Copy the entire contents of the `sql_migration.sql` file.
3. Go to your [Supabase Dashboard](https://supabase.com/dashboard) and open the PromptBazaar project.
4. On the left sidebar, click on **SQL Editor**.
5. Click **New Query**.
6. Paste the copied SQL script into the editor.
7. Click **Run** (or `Cmd+Enter` / `Ctrl+Enter`).
8. You should see a "Success" message indicating the functions were recreated with the correct signatures and the schema cache was reloaded.

## 3. Verify
After running the script, refresh the live app. Unlocked items will now properly fetch their prompt content from the database.
