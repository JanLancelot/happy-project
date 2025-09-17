import os
import shutil

def js_to_txt(source_folder, target_folder):
    # Create target folder if it does not exist
    os.makedirs(target_folder, exist_ok=True)

    # Loop through all files in source folder
    for filename in os.listdir(source_folder):
        if filename.endswith(".js"):
            js_file_path = os.path.join(source_folder, filename)

            # New file name with .txt extension
            txt_file_path = os.path.join(target_folder, os.path.splitext(filename)[0] + ".txt")

            # Read content from .js file
            with open(js_file_path, "r", encoding="utf-8") as js_file:
                content = js_file.read()

            # Write content into .txt file in the target folder
            with open(txt_file_path, "w", encoding="utf-8") as txt_file:
                txt_file.write(content)

            print(f"Converted: {filename} → {os.path.basename(txt_file_path)}")

if __name__ == "__main__":
    source = os.path.join(os.getcwd(), "pages")   # assumes 'pages' is in same dir as script
    target = os.path.join(os.getcwd(), "converted_pages")  # new folder for txt files

    if os.path.isdir(source):
        js_to_txt(source, target)
        print(f"All .js files from '{source}' converted and saved to '{target}'.")
    else:
        print("Source folder 'pages' not found.")
