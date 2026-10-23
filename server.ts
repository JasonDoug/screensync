import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side Gemini AI client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION = `You are ScreenSight AI, an intelligent desktop visual co-pilot and expert tutor.
CRITICAL OPERATIONAL CONSTRAINTS:
1. You ONLY OBSERVE the user's desktop screen. You CANNOT interact, click, type, or manipulate anything on their computer.
2. Every action must be executed by the user themselves; provide precise, crystal-clear instructions.
3. Refer directly to visual landmarks on their screen (e.g., "Look at the terminal tab at the bottom", "In the top-right corner of the window", "In line 34 with the red underline").
4. Visual Pin Radar: Whenever referencing a specific button, input box, menu item, or error message on screen, include an approximate coordinate pin tag in your answer like [pin: X%, Y%] where X is horizontal (0% left, 100% right) and Y is vertical (0% top, 100% bottom). For example: [pin: 88%, 14%] for top right or [pin: 25%, 60%] for editor middle left. The UI will render an interactive visual highlight circle at that location.
5. Be concise, polite, encouraging, and technically sharp. Provide commands or code snippets in formatted markdown blocks with copy-friendly formatting.`;

// Endpoint: Main conversational screen analysis and guidance
app.post('/api/analyze-screen', async (req: Request, res: Response) => {
  try {
    const { imageBase64, message, conversation = [], mode = 'chat' } = req.body;

    if (!imageBase64 && conversation.length === 0 && !message) {
      return res.status(400).json({ error: 'Image or message required' });
    }

    let promptModePrefix = '';
    if (mode === 'tutorial') {
      promptModePrefix = `[MODE: TUTORIAL GENERATION & WALKTHROUGH]\nUser Goal: ${message}\nAnalyze the current screen carefully. Provide a step-by-step interactive tutorial suited to this exact visual state. Highlight key UI elements with [pin: X%, Y%] tags. Include prerequisites, action steps, and expected outcomes.`;
    } else if (mode === 'troubleshoot') {
      promptModePrefix = `[MODE: TROUBLESHOOTING & ERROR DIAGNOSIS]\nUser Problem Description: ${message}\nInspect the screen for error logs, stack traces, compiler warnings, syntax mistakes, missing configs, or UI anomalies. Identify the root cause, point out the exact visual location using [pin: X%, Y%], and provide step-by-step fixes.`;
    } else if (mode === 'quick-observe') {
      promptModePrefix = `[MODE: LIVE SCREEN OBSERVER]\nGive a rapid 2-3 sentence overview of what is currently on the screen, active window/task, and any immediate helpful tip or detected error. Keep it snappy and actionable.`;
    } else {
      promptModePrefix = message || 'Analyze this screen and tell me what you see.';
    }

    const contents: any[] = [];

    // Include prior conversation turns if provided
    if (Array.isArray(conversation)) {
      for (const turn of conversation.slice(-6)) {
        contents.push({
          role: turn.role === 'assistant' || turn.role === 'model' ? 'model' : 'user',
          parts: [{ text: turn.text || turn.content || '' }],
        });
      }
    }

    // Prepare current user turn with vision image
    const parts: any[] = [];
    if (imageBase64) {
      // Strip data:image/...;base64, prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    parts.push({ text: promptModePrefix });
    contents.push({ role: 'user', parts });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4,
      },
    });

    const replyText = response.text || 'Unable to generate analysis for this screen frame.';

    // Extract any visual pins from the text: [pin: 50%, 20%]
    const pinRegex = /\[pin:\s*(\d+(?:\.\d+)?)%?\s*,\s*(\d+(?:\.\d+)?)%?\]/gi;
    const pins: { x: number; y: number }[] = [];
    let match;
    while ((match = pinRegex.exec(replyText)) !== null) {
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);
      if (!isNaN(x) && !isNaN(y)) {
        pins.push({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
      }
    }

    res.json({
      text: replyText,
      pins,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error analyzing screen:', error);
    res.status(500).json({
      error: error.message || 'Internal server error during screen analysis',
    });
  }
});

// Endpoint: Structured Tutorial Builder
app.post('/api/generate-tutorial', async (req: Request, res: Response) => {
  try {
    const { imageBase64, topic } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Screenshot image required' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Inspect this desktop screen and generate a high quality structured tutorial for: "${topic || 'Guided walkthrough of what is visible'}".
The response MUST follow the JSON schema provided.
Remember you only observe the screen. All actions must be told to the user with exact visual indicators.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Engaging title for the tutorial' },
            overview: { type: Type.STRING, description: 'Summary of what will be achieved' },
            estimatedMinutes: { type: Type.INTEGER, description: 'Estimated time in minutes' },
            difficulty: { type: Type.STRING, description: 'Beginner, Intermediate, or Advanced' },
            detectedEnvironment: { type: Type.STRING, description: 'e.g., VS Code, Chrome DevTools, Terminal, Blender, Excel, etc.' },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  instructions: { type: Type.STRING, description: 'Detailed instruction for the user' },
                  targetElement: { type: Type.STRING, description: 'Visual landmark on screen to look at' },
                  pinCoordinates: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER, description: 'Approx horizontal percent 0-100' },
                      y: { type: Type.NUMBER, description: 'Approx vertical percent 0-100' },
                    },
                    required: ['x', 'y'],
                  },
                  codeSnippetOrKey: { type: Type.STRING, description: 'Optional code snippet, hotkey, or command' },
                  verificationHint: { type: Type.STRING, description: 'What user should see when done' },
                },
                required: ['stepNumber', 'title', 'instructions', 'targetElement', 'verificationHint'],
              },
            },
            proTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['title', 'overview', 'estimatedMinutes', 'difficulty', 'steps'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating tutorial:', error);
    res.status(500).json({ error: error.message || 'Failed to generate tutorial' });
  }
});

// Endpoint: Step Verification (compares current screen with expected step outcome)
app.post('/api/verify-step', async (req: Request, res: Response) => {
  try {
    const { imageBase64, currentStep, expectedOutcome } = req.body;

    if (!imageBase64 || !currentStep) {
      return res.status(400).json({ error: 'Image and step information required' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `The user is following a tutorial.
Current Step: "${currentStep}"
Expected outcome on screen: "${expectedOutcome || ''}"

Inspect the new desktop frame. Did the user accomplish this step, or are they stuck / is something else displayed?
Output in JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            completed: { type: Type.BOOLEAN, description: 'True if user completed the step successfully' },
            feedback: { type: Type.STRING, description: 'Friendly visual feedback of what you see now' },
            correction: { type: Type.STRING, description: 'If not completed, what they should adjust or click' },
            pinCoordinates: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
              },
            },
          },
          required: ['completed', 'feedback'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error verifying step:', error);
    res.status(500).json({ error: error.message || 'Failed to verify step' });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Integrate Vite middleware in development, static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server listening at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
