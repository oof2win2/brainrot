import base64
from PIL import Image
import vecs
from sentence_transformers import SentenceTransformer
from openai import OpenAI
import time
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import io


load_dotenv(override=True)
DB_CONNECTION = "postgresql://postgres.qktflwprnrumzlglbwra:2g2jy#8%rQQW4C^7@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

print("Creating supabase client...", end=" ")
vx = vecs.create_client(DB_CONNECTION)
sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
print("✔")

print("Loading CLIP model...", end=" ")
model = SentenceTransformer("clip-ViT-B-32")
print("✔")

print("Retrieving image vector collection...", end=" ")
images = vx.get_or_create_collection(name="image_vectors", dimension=512)
print("✔")


print("Initializing OpenAI client...", end=" ")
client = OpenAI(

)
print("✔")


def store_frame(image, frame_number):
    vector = model.encode(image)

    images.upsert(records=[(f"{frame_number}.jpg", vector, {"type": "jpg"})])

    image.save(f"images/{frame_number}.jpg")
    image.save(f"latest.jpeg")

    print(f"Stored frame {frame_number}")


def search(query_string):
    print("Encoding search query...", end=" ")
    vector = model.encode(query_string)
    print("✔")

    print("Searching for results...", end=" ")
    results = images.query(data=vector, limit=1)
    print("✔")

    print(f"Found {len(results)} results for query `{query_string}`")
    if results:
        # image = Image.open(f"images/{results[0]}")
        # image.show()
        print(f"Found image: {results[0]}")
        return f"images/{results[0]}"
    else:
        return None


def get_keywords(query_string):
    print("Getting keywords...", end=" ")
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "you're a keyword extractor tool that finds keywords from user input that will be used in searching a vector database. extract the relevant keywords into one string from the user's request. Only return the string itself, do not return anything else. Do not include any punctuation in the string or any symbols. Only include words that will be useful for searching the database for that image.",
            },
            {"role": "user", "content": query_string},
        ],
    )
    print("✔")
    return completion.choices[0].message.content


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def encode_image_from_pil(image):
    return base64.b64encode(image.tobytes()).decode("utf-8")


def getResponse(image_path, query_string):
    num = int(image_path.replace("images/", "").replace(".jpg", ""))
    first = num - 30
    base64_image_1 = encode_image(f"images/{first}.jpg")
    base64_image = encode_image(image_path)

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": """
             you are a virtual assistant that helps users. the user will ask you a question.
             you have access to this user's memories and everything they've ever seen.
             the attached image shows the last relevant picture. they may not remember this, but you can see it.
             please return a brief response that answer's the user's question.
             state which objects you see if it helps.
             REMEMBER: THE IMAGE YOU ARE SEEING IS NOT LIVE, IT IS FROM THE PAST.
             THE USER DOES NOT SEE THIS IMAGE, ONLY YOU SEE IT.
             THIS IMAGE IS FROM THE PAST. REFER TO IT IN THE PAST
             
             EXAMPLE INPUT:
             "Have you seen my glasses anywhere?"
             EXAMPLE OUTPUT:
             "Yeah, I saw your glasses on the table next to a red apple."

             EXAMPLE INPUT:
             "Do you remember where I left my keys?"
             EXAMPLE OUTPUT:
             "Yes, I saaw your keys on the brown door."
             

             REMEMBER, NEVER REFERENCE THE IMAGE OR THE FACT THAT YOU CAN SEE IT IN YOUR RESPONSE, ONLY REFER TO IT IN THE PAST.
             """,
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": f"user question: {query_string}"},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image_1}"
                        },
                    },
                ],
            },
        ],
    )

    return completion.choices[0].message.content


def recallObject(query_string):
    start = time.time()
    keywords = get_keywords(query_string)
    image_path = search(keywords)
    print(image_path)

    if image_path:
        response = getResponse(image_path, query_string)
        end = time.time()
        print(f"Time elapsed: {end - start}")
        return response
    else:
        end = time.time()
        print(f"Time elapsed: {end - start}")
        return "I'm sorry, I couldn't find anything related to that."
