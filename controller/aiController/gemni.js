const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');



// Vertex AI Configuration
const PROJECT_ID = process.env.VERTEX_PROJECT_ID || 'dolet-app';
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const SERVICE_ACCOUNT_KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!PROJECT_ID) {
  console.error("VERTEX_PROJECT_ID not set in environment");
}



// Initialize Google Auth
let auth;
try {
  auth = new GoogleAuth({
    keyFilename: SERVICE_ACCOUNT_KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  console.log(" Google Auth initialized for Vertex AI");
} catch (err) {
  console.error(" Failed to initialize Google Auth:", err.message);
}

const prewrittenDescription = `You are a professional writing assistant. Your task is to improve the following text by:
1. Correcting all grammar mistakes
2. Fixing any spelling errors
3. Making the language more professional and formal
4. Improving clarity and sentence structure
5. Breaking content into meaningful, well-structured sentences
6. Maintaining the original meaning and intent

Please provide ONLY the improved text without any explanations, introductions, or additional comments.`;




function extractAiText(response) {
  try {
    const candidates = response?.candidates;
    if (Array.isArray(candidates) && candidates.length > 0) {
      const parts = candidates[0]?.content?.parts;
      if (Array.isArray(parts) && parts.length > 0) {
        return parts[0]?.text || null;
      }
    }
    return null;
  } catch (err) {
    console.error("Error extracting AI text:", err);
    return null;
  }
}


async function getAccessToken() {
  try {
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token;
  } catch (err) {
    console.error("Failed to get access token:", err);
    throw new Error('Authentication failed: ' + err.message);
  }
}


async function generateWithVertexAI(prompt) {
  // Try Gemini 2.5 models first (newest), then fallback to 1.5
  const modelNames = [
    "gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"
  ];

  let lastError = null;
  
  // Get OAuth2 access token
  let accessToken;
  try {
    accessToken = await getAccessToken();
  } catch (err) {
    throw new Error('Failed to authenticate with Google Cloud: ' + err.message);
  }
  
  for (const modelName of modelNames) {
    try {
      console.log(` Trying Vertex AI model: ${modelName}`);
      
      // Vertex AI REST API endpoint
      const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${modelName}:generateContent`;
      
      console.log(`📍 Endpoint: ${endpoint}`);
      
      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
      };

      const response = await axios.post(endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        timeout: 30000
      });

      console.log(` Model ${modelName} succeeded`);
      return response.data;
      
    } catch (err) {
      lastError = err;
      const errorMsg = err?.response?.data?.error?.message || err.message;
      const errorStatus = err?.response?.status;
      console.warn(` Model ${modelName} failed (${errorStatus}):`, errorMsg);
      
      // Log more details for debugging
      if (err?.response?.data) {
        console.warn('Full error response:', JSON.stringify(err.response.data, null, 2));
      }
    }
  }

  throw lastError || new Error('All Vertex AI models failed');
}

const improveText = async (req, res) => {
  console.log('\n✨ [STEP 1] Starting Text Improvement');
  
  try {
    // Validate configuration
    console.log('🔍 [STEP 2] Validating configuration...');
    
    if (!PROJECT_ID) {
      console.error('❌ Validation failed: PROJECT_ID missing');
      return res.status(500).json({
        success: false,
        message: "Server configuration error: VERTEX_PROJECT_ID missing.",
      });
    }

    if (!auth) {
      console.error('❌ Validation failed: Google Auth not initialized');
      return res.status(500).json({
        success: false,
        message: "Server configuration error: Google Auth not initialized. Please set GOOGLE_APPLICATION_CREDENTIALS.",
      });
    }
    
    console.log('✅ Configuration validated');

    // Validate request
    console.log('🔍 [STEP 3] Validating user input...');
    const userDescription = req.body?.description ?? req.body?.text ?? null;
    
    if (!userDescription || typeof userDescription !== "string" || userDescription.trim() === "") {
      console.error('❌ Validation failed: Description missing or invalid');
      return res.status(400).json({ 
        success: false, 
        message: "Description required in request body." 
      });
    }
    
    console.log(`✅ User description received: "${userDescription.substring(0, 50)}..."`);

    // Build prompt
    console.log('📝 [STEP 4] Building AI prompt...');
    const prompt = `${prewrittenDescription}

Text to improve:
"${userDescription}"

Improved text:`;
    
    console.log('✅ Prompt built successfully');

    // Generate content using Vertex AI
    console.log('🤖 [STEP 5] Calling Vertex AI to improve text...');
    let aiResp = null;
    try {
      aiResp = await generateWithVertexAI(prompt);
      console.log('✅ AI response received');
    } catch (err) {
      console.error("❌ Vertex AI generation failed:", err.message);
      return res.status(500).json({
        success: false,
        message: "Failed to improve text with Vertex AI. Check server logs.",
        error: err?.message || String(err),
      });
    }

    // Extract text from response
    console.log('📄 [STEP 6] Extracting text from AI response...');
    const improvedText = extractAiText(aiResp);
    
    if (!improvedText) {
      console.error('❌ No text content found in AI response');
      return res.status(500).json({
        success: false,
        message: "No text content in AI response",
        response: aiResp,
      });
    }
    
    console.log(`✅ Text extracted (${improvedText.length} characters)`);

    // Clean up the improved text
    console.log('🧹 [STEP 7] Cleaning up improved text...');
    const cleanedText = improvedText
      .replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
      .replace(/^\*\*|^\*|\*\*$|\*$/g, '') // Remove markdown bold/italic
      .replace(/^Improved text:\s*/i, '') // Remove "Improved text:" prefix if present
      .trim();
    
    console.log('✅ Text cleaned');
 
    console.log('✨ [STEP 8] Sending response to client...');
    
    // Send response with improved text
    const response = {
      success: true,
      message: 'Text improved successfully',
      data: {
        original: userDescription,
        improved: cleanedText,
        characterCount: {
          original: userDescription.length,
          improved: cleanedText.length
        }
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error("❌ [ERROR] improveText failed:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: error?.message ?? String(error) 
    });
  }
};

module.exports = {
  improveText,
};
