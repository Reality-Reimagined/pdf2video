from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import stripe
import os
from dotenv import load_dotenv
import logging
from pdfminer.high_level import extract_text
from deepgram import DeepgramClient, SpeakOptions
from moviepy.video.io.VideoFileClip import VideoFileClip
from moviepy.audio.AudioFileClip import AudioFileClip
import ffmpeg
import assemblyai as aai
import requests
from together import Together

# Load environment variables
load_dotenv()

# API Keys
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PIXABAY_API_KEY = os.getenv("PIXABAY_API_KEY")
ASSEMBLY_AI_API_KEY = os.getenv("ASSEMBLY_AI_API_KEY")
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")

# Configure Stripe
stripe.api_key = STRIPE_SECRET_KEY

# Configure logging
logging.basicConfig(level=logging.INFO)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Stripe webhook secret
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# Your existing endpoints here...
# File Cleanup
def clean_up_files():
    files_to_delete = ["output.wav", "background.mp4", "output_video.mp4", "output_with_subtitles.mp4", "subtitles.srt"]
    for file in files_to_delete:
        if os.path.exists(file):
            os.remove(file)
    logging.info("Temporary files cleaned up.")

# Extract Text from PDF
@app.post("/extract-text/")
async def extract_pdf_text(file: UploadFile = File(...)):
    try:
        content = await file.read()
        with open("temp.pdf", "wb") as f:
            f.write(content)
        text = extract_text("temp.pdf")
        os.remove("temp.pdf")
        return {"text": text}
    except Exception as e:
        logging.error(f"Error extracting text: {e}")
        raise HTTPException(status_code=500, detail="Error extracting text from PDF.")

# Generate Script
@app.post("/generate-script/")
async def generate_script(text: str):
    try:
        if GROQ_API_KEY:
            from groq import Groq
            client = Groq(api_key=GROQ_API_KEY)
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": text}],
                temperature=0.4,
                max_tokens=1500,
            )
        else:
            client = Together(api_key=TOGETHER_API_KEY)
            response = client.chat.completions.create(
                model="meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
                messages=[{"role": "user", "content": text}],
                temperature=0.4,
                max_tokens=1500,
            )
        return {"script": response.choices[0].message.content}
    except Exception as e:
        logging.error(f"Error generating script: {e}")
        raise HTTPException(status_code=500, detail="Error generating script.")

# Text-to-Speech
@app.post("/text-to-speech/")
async def text_to_speech(text: str):
    try:
        if os.path.exists("output.wav"):
            return {"message": "Audio file already exists."}
        deepgram = DeepgramClient(api_key=DEEPGRAM_API_KEY)
        options = SpeakOptions(model="aura-zeus-en")
        response = deepgram.speak.synthesize(text=text, options=options)
        with open("output.wav", "wb") as f:
            f.write(response.audio)
        return {"message": "Audio generated successfully."}
    except Exception as e:
        logging.error(f"Error generating speech: {e}")
        raise HTTPException(status_code=500, detail="Error generating speech.")

# Fetch Background Video
@app.get("/background-video/")
async def get_background_video(query: str = Query("city")):
    try:
        if os.path.exists("background.mp4"):
            return {"message": "Background video already exists."}
        if not PIXABAY_API_KEY:
            raise HTTPException(status_code=500, detail="Pixabay API key is missing.")
        url = f"https://pixabay.com/api/videos/?key={PIXABAY_API_KEY}&q={query}&per_page=3"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        for hit in data.get("hits", []):
            if "videos" in hit and "medium" in hit["videos"]:
                video_url = hit["videos"]["medium"]["url"]
                video_response = requests.get(video_url)
                with open("background.mp4", "wb") as f:
                    f.write(video_response.content)
                return {"message": "Background video fetched successfully."}
        raise HTTPException(status_code=404, detail="No videos found.")
    except Exception as e:
        logging.error(f"Error fetching background video: {e}")
        raise HTTPException(status_code=500, detail="Error fetching background video.")

# Create Video
@app.post("/create-video/")
async def create_video():
    try:
        if os.path.exists("output_video.mp4"):
            return {"message": "Video already exists."}
        if not os.path.exists("output.wav") or not os.path.exists("background.mp4"):
            raise HTTPException(status_code=500, detail="Missing required files.")
        audio = AudioFileClip("output.wav")
        video = VideoFileClip("background.mp4")
        video = video.set_audio(audio).subclip(0, audio.duration)
        video.write_videofile("output_video.mp4", codec="libx264", audio_codec="aac")
        return {"message": "Video created successfully."}
    except Exception as e:
        logging.error(f"Error creating video: {e}")
        raise HTTPException(status_code=500, detail="Error creating video.")

# Generate Subtitles
@app.post("/generate-subtitles/")
async def generate_subtitles():
    try:
        if os.path.exists("subtitles.srt"):
            return {"message": "Subtitles already exist."}
        if not ASSEMBLY_AI_API_KEY:
            raise HTTPException(status_code=500, detail="AssemblyAI API key is missing.")
        aai.settings.api_key = ASSEMBLY_AI_API_KEY
        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe("output.wav")
        subtitles = transcript.export_subtitles_srt()
        with open("subtitles.srt", "w") as f:
            f.write(subtitles)
        return {"message": "Subtitles generated successfully."}
    except Exception as e:
        logging.error(f"Error generating subtitles: {e}")
        raise HTTPException(status_code=500, detail="Error generating subtitles.")

# Add Hard Subtitles
@app.post("/add-hard-subtitles/")
async def add_hard_subtitles():
    try:
        if os.path.exists("output_with_subtitles.mp4"):
            return {"message": "Subtitled video already exists."}
        ffmpeg.input("output_video.mp4").output(
            "output_with_subtitles.mp4", vf="subtitles=subtitles.srt", vcodec="libx264", acodec="aac"
        ).run(overwrite_output=True)
        return {"message": "Subtitled video created successfully."}
    except Exception as e:
        logging.error(f"Error adding hard subtitles: {e}")
        raise HTTPException(status_code=500, detail="Error adding hard subtitles.")

# Cleanup Endpoint
@app.post("/clean-up/")
async def clean_up():
    clean_up_files()
    return {"message": "Temporary files cleaned up."}


@app.post("/create-checkout-session")
async def create_checkout_session(request: dict):
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': request.get('priceId'),
                'quantity': 1,
            }],
            mode='subscription',
            success_url='http://localhost:5173/dashboard?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:5173/dashboard',
        )
        return JSONResponse(content={"id": checkout_session.id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/webhook")
async def stripe_webhook(request: Request):
    try:
        # Get the webhook secret from environment variable
        webhook_secret = STRIPE_WEBHOOK_SECRET
        
        # Get the webhook data
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail='Invalid payload')
        except stripe.error.SignatureVerificationError as e:
            raise HTTPException(status_code=400, detail='Invalid signature')
        
        # Handle the event
        if event['type'] == 'customer.subscription.updated':
            subscription = event['data']['object']
            # Update user's subscription status in your database
            # This is where you'd update the user's subscription status
            logging.info(f"Subscription updated: {subscription.id}")
            
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            # Handle subscription cancellation
            logging.info(f"Subscription cancelled: {subscription.id}")
            
        return JSONResponse(content={"status": "success"})
    except Exception as e:
        logging.error(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Rest of your existing endpoints...