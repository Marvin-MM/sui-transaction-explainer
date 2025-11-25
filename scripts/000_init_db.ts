import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.POSTGRES_URL || process.env.DATABASE_URL || "")

async function initializeDatabase() {
  try {
    console.log("Starting database initialization...")

    // Create profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        wallet_address TEXT UNIQUE,
        wallet_provider TEXT,
        display_name TEXT,
        onboarding_email_sent BOOLEAN DEFAULT FALSE,
        theme TEXT DEFAULT 'system',
        language TEXT DEFAULT 'en',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    console.log("✓ Created profiles table")

    // Enable RLS on profiles
    await sql`ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`
    console.log("✓ Enabled RLS on profiles")

    // Create RLS policies for profiles
    await sql`
      DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
      CREATE POLICY "Users can view their own profile"
        ON public.profiles FOR SELECT
        USING (auth.uid() = id);
    `

    await sql`
      DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
      CREATE POLICY "Users can update their own profile"
        ON public.profiles FOR UPDATE
        USING (auth.uid() = id);
    `

    await sql`
      DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
      CREATE POLICY "Users can delete their own profile"
        ON public.profiles FOR DELETE
        USING (auth.uid() = id);
    `
    console.log("✓ Created RLS policies for profiles")

    // Create user_preferences table
    await sql`
      CREATE TABLE IF NOT EXISTS public.user_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
        dark_mode BOOLEAN DEFAULT FALSE,
        email_notifications BOOLEAN DEFAULT TRUE,
        push_notifications BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    console.log("✓ Created user_preferences table")

    // Enable RLS on user_preferences
    await sql`ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;`

    await sql`
      DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
      CREATE POLICY "Users can view their own preferences"
        ON public.user_preferences FOR SELECT
        USING (auth.uid() = user_id);
    `

    await sql`
      DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
      CREATE POLICY "Users can update their own preferences"
        ON public.user_preferences FOR UPDATE
        USING (auth.uid() = user_id);
    `
    console.log("✓ Created RLS policies for user_preferences")

    // Create auth trigger function
    await sql`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public.profiles (id, email)
        VALUES (new.id, new.email)
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.user_preferences (user_id)
        VALUES (new.id)
        ON CONFLICT (user_id) DO NOTHING;

        RETURN new;
      END;
      $$;
    `
    console.log("✓ Created auth trigger function")

    // Create or update trigger
    await sql`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    `

    console.log("✓ Database initialization complete!")
  } catch (error) {
    console.error("Database initialization failed:", error)
    process.exit(1)
  }
}

initializeDatabase()
