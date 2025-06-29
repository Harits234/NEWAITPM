// Import necessary packages
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Configuration ---
const app = express();
const port = 3000; // Port for our backend server

// =================================================================================
// !!! PERINGATAN KEAMANAN YANG SANGAT PENTING !!!
// MENYIMPAN API KEY LANGSUNG DI KODE SANGAT BERISIKO, BAHKAN DI REPO PRIVATE.
// JIKA REPO INI TIDAK SENGAJA MENJADI PUBLIK, KEY ANDA AKAN DICURI.
// Ganti placeholder di bawah ini dengan kunci API Anda.
const GOOGLE_API_KEY = "AIzaSyCs-tKwbxY1zlxZ7BTfmboHB1niwFudZj0";
// =================================================================================


// Initialize Google Generative AI
// Memeriksa jika kuncinya MASIH placeholder, bukan memeriksa kunci asli Anda
if (GOOGLE_API_KEY === "AIzaSyCs-tKwbxY1zlxZ7BTfmboHB1niwFudZj0") { 
    console.error("CRITICAL ERROR: Google API Key has not been set in server.js. Please replace the placeholder text.");
    process.exit(1); // Stop the server if the key is not set
}
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// --- Middleware ---
app.use(cors()); // Allow requests from our frontend
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies

// Configure Multer for file uploads (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Helper Functions ---
// Function to convert a buffer to a Gemini-compatible part
function fileToGenerativePart(buffer, mimeType) {  
    return {
        inlineData: {
            data: buffer.toString('base64'),
            mimeType
        },
    };
}

// --- API Endpoint ---
app.post('/api/analyze', upload.single('chartImage'), async (req, res) => {
    console.log('Received analysis request...');

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No chart image uploaded.' });
        }

        const { strategy, timeframe } = req.body;
        if (!strategy || !timeframe) {
            return res.status(400).json({ error: 'Strategy and timeframe are required.' });
        }

        console.log(`Strategy: ${strategy}, Timeframe: ${timeframe}`);

        const imageBuffer = req.file.buffer;
        const imageMimeType = req.file.mimetype;

        const imagePart = fileToGenerativePart(imageBuffer, imageMimeType);

        const prompt = `
            You are a world-class professional trading analyst called "The Pips Mafia AI".
            Your task is to analyze the provided trading chart image.
            
            Based *only* on the visual information in the chart, perform an analysis using the following trading strategy: **${strategy}**.
            The user has specified they are looking at the **${timeframe}** timeframe.

            Your response must be structured in JSON format with two keys: "position" and "reason".
            1.  "position": Provide a clear, actionable trading suggestion (e.g., "BUY LIMIT @ 1.25000", "SELL @ Market", "WAIT FOR CONFIRMATION").
            2.  "reason": Explain your analysis step-by-step based on the chosen strategy. Be concise but thorough. Justify why you are suggesting that position.

            Analyze the image now.
        `;
        
        console.log('Sending request to Google AI...');
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = await result.response.text();
        console.log('Received response from Google AI.');

        // Clean the response text to ensure it's valid JSON
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Parse the JSON string from AI response
        const jsonResponse = JSON.parse(cleanedText);

        res.json(jsonResponse);

    } catch (error) {
        console.error('Error during AI analysis:', error);
        res.status(500).json({ 
            position: "Analysis Failed",
            reason: `An internal server error occurred. This could be due to an invalid API key, issues with the AI model, or an unexpected analysis result. Check the backend console for more details. Error: ${error.message}`
        });
    }
});

// --- Server Startup ---
app.listen(port, () => {
    console.log(`The Pips Mafia AI backend is running at http://localhost:${port}`);
}); 