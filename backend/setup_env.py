import os
import getpass

def setup_environment():
    print("=========================================================================")
    print("             AORA AI - INTERACTIVE ENVIRONMENT CONFIGURATOR              ")
    print("=========================================================================")
    print("This script will guide you step-by-step to configure your secrets.")
    print("Keystrokes will be hidden for security. Press Enter to skip any variable.\n")

    env_path = ".env"
    
    # Read existing variables if .env already exists
    existing_vars = {}
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if "=" in line and not line.strip().startswith("#"):
                    k, v = line.strip().split("=", 1)
                    existing_vars[k.strip()] = v.strip()

    # Define variables to ask for
    vars_to_prompt = [
        {
            "key": "DATABASE_URL",
            "description": "Supabase Connection Pooler URL (e.g. postgresql://postgres.xxxx:password@pooler.supabase.com:5432/postgres)",
            "link": "https://supabase.com/dashboard/project/_/settings/database"
        },
        {
            "key": "GEMINI_API_KEY",
            "description": "Google Gemini Developer API Key (Recommended for free LLM access)",
            "link": "https://aistudio.google.com/"
        },
        {
            "key": "OPENAI_API_KEY",
            "description": "OpenAI API Key (Required for GPT-4o and Whisper transcription)",
            "link": "https://platform.openai.com/api-keys"
        },
        {
            "key": "CLERK_API_KEY",
            "description": "Clerk Backend Secret Auth Key",
            "link": "https://dashboard.clerk.com/"
        },
        {
            "key": "SUPABASE_URL",
            "description": "Supabase Project URL API Gateway (for Storage attachments)",
            "link": "https://supabase.com/dashboard/project/_/settings/api"
        },
        {
            "key": "SUPABASE_KEY",
            "description": "Supabase Project Service Role or Anon API Key",
            "link": "https://supabase.com/dashboard/project/_/settings/api"
        },
        {
            "key": "RAZORPAY_KEY_ID",
            "description": "Razorpay Key ID (for billing and payment orders)",
            "link": "https://dashboard.razorpay.com/app/keys"
        },
        {
            "key": "RAZORPAY_KEY_SECRET",
            "description": "Razorpay Key Secret (for order creation and signature verification)",
            "link": "https://dashboard.razorpay.com/app/keys"
        }
    ]

    new_vars = {}
    for var in vars_to_prompt:
        key = var["key"]
        desc = var["description"]
        link = var["link"]
        
        print(f"--- Setting: {key} ---")
        print(f"Description: {desc}")
        print(f"Where to get it: {link}")
        
        # Check if already set
        if key in existing_vars:
            print(f"(Current value: [ALREADY SET])")
            choice = input("Do you want to overwrite it? (y/N): ").strip().lower()
            if choice != 'y':
                new_vars[key] = existing_vars[key]
                print("Skipped.\n")
                continue
        
        val = getpass.getpass(prompt=f"Enter {key} (typing hidden): ").strip()
        if val:
            new_vars[key] = val
            print("Captured successfully.\n")
        else:
            if key in existing_vars:
                new_vars[key] = existing_vars[key]
            print("Value left unchanged/empty.\n")

    # Write out the new .env file
    with open(env_path, "w") as f:
        f.write("# =========================================================================\n")
        f.write("# AORA AI - ACTIVE CONFIGURATIONS\n")
        f.write("# =========================================================================\n\n")
        
        # Write configured vars
        for k, v in new_vars.items():
            f.write(f"{k}={v}\n")
            
        # Write defaults for remaining keys
        defaults = {
            "PROJECT_NAME": "Aora AI Backend",
            "REDIS_URL": "redis://localhost:6379/0",
            "QDRANT_HOST": "localhost",
            "QDRANT_PORT": "6333",
            "SUPABASE_BUCKET": "aora-assets"
        }
        f.write("\n# Defaults & Environment Settings\n")
        for k, v in defaults.items():
            if k not in new_vars:
                f.write(f"{k}={v}\n")
                
    print("=========================================================================")
    print("Configuration saved to backend/.env successfully!")
    print("=========================================================================")

if __name__ == "__main__":
    setup_environment()
