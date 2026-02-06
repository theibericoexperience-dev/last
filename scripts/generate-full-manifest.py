import os
import json
import urllib.parse

def generate_manifest():
    base_dir = "/home/Rjmenaya/IBERO/public/MEDIAWEB"
    project_id = "wqpyfdxbkvvzjoniguld"
    base_supabase_url = f"https://{project_id}.supabase.co/storage/v1/object/public"
    
    manifest = []
    
    # Bucket mapping rules
    # (bucket_name, substring_to_match)
    rules = [
        ("vidoe behind", "tinta-behind-background-opt.webm"),
        ("ACTIVITITES", "activities_optimized"),
        ("behind", "BEHIND_OPTIMIZED"),
        ("MISC", "LANDING"),
        ("pdf-prueba", "PDFS"),
        ("Tours", "TOURS")
    ]

    for root, dirs, files in os.walk(base_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, "/home/Rjmenaya/IBERO/public")
            
            # Find matching bucket
            bucket = None
            for b, match in rules:
                if match in full_path:
                    bucket = b
                    break
            
            if not bucket:
                continue
                
            # Path inside the bucket:
            # The prompt says they are organized the same way, but usually the bucket root 
            # might not include the prefix like "activities_optimized" if it was uploaded as the root.
            # However, looking at the user's example: 
            # "Open Tours/TOURS/2026/MADRID TO LISBOA/photo 1.jpg" in the bucket Tours
            # This suggests the path starts from whatever was uploaded.
            
            # Let's assume the path in the bucket starts from the folder inside MEDIAWEB OR 
            # exactly as it is in the repo if they uploaded the whole MEDIAWEB content.
            # The user's example for Tours: "Open Tours/..."
            # In my repo I have "MEDIAWEB/TOURS/Open Tours/..."
            
            # If the bucket is "Tours", and the local path is "public/MEDIAWEB/TOURS/Open Tours/...", 
            # the bucket path seems to be "Open Tours/..." (skipping MEDIAWEB/TOURS)
            
            bucket_path = ""
            if bucket == "vidoe behind":
                bucket_path = file
            elif bucket == "ACTIVITITES":
                # Path relative to activities_optimized
                bucket_path = os.path.relpath(full_path, os.path.join(base_dir, "activities_optimized"))
            elif bucket == "behind":
                bucket_path = os.path.relpath(full_path, os.path.join(base_dir, "BEHIND_OPTIMIZED"))
            elif bucket == "MISC":
                bucket_path = os.path.relpath(full_path, os.path.join(base_dir, "LANDING"))
            elif bucket == "pdf-prueba":
                bucket_path = os.path.relpath(full_path, os.path.join(base_dir, "PDFS"))
            elif bucket == "Tours":
                bucket_path = os.path.relpath(full_path, os.path.join(base_dir, "TOURS"))

            # Clean bucket_path (remove leading ./ if any)
            bucket_path = bucket_path.replace("\\", "/")
            if bucket_path.startswith("./"):
                bucket_path = bucket_path[2:]
            
            # URL Encoding
            encoded_path = "/".join([urllib.parse.quote(part) for part in bucket_path.split("/")])
            encoded_bucket = urllib.parse.quote(bucket)
            
            public_url = f"{base_supabase_url}/{encoded_bucket}/{encoded_path}"
            
            manifest.append({
                "localPath": "/" + rel_path.replace("\\", "/"),
                "publicUrl": public_url,
                "name": file,
                "bucket": bucket,
                "bucketPath": bucket_path
            })

    output_path = "/home/Rjmenaya/IBERO/build/all-media-manifest.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    
    print(f"Manifest generated with {len(manifest)} entries at {output_path}")

if __name__ == "__main__":
    generate_manifest()
