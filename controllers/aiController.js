const OpenAI = require("openai");

const openai = new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY
});

const testAi = async (req, res) => {
    try {
        const userMessage = req.query.message || null;

        if (!userMessage) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const completion = await openai.chat.completions.create({
            model: "deepseek/deepseek-r1-distill-llama-70b:free",
            messages: [
                {
                    "role": "user",
                    "content": userMessage
                }
            ]
        });

        res.json({ message: completion.choices[0].message.content });
    } catch (error) {
        console.error('OpenAI API error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const recipeDetails = async (req, res) => {
    try {
        const recipe = req.body || null;

        if (!recipe) {
            return res.status(400).json({ error: 'Recipe is required' });
        }

        const getRecipeAnalysis = async (instruction) => {
            const completion = await openai.chat.completions.create({
                model: "deepseek/deepseek-r1-distill-llama-70b:free",
                messages: [
                    {
                        "role": "system",
                        "content": instruction
                    },
                    {
                        "role": "user",
                        "content": JSON.stringify(recipe)
                    }
                ]
            });

            return completion.choices[0].message.content.trim();
        };

        const initialInstruction = `
        You are an advanced recipe analysis AI. 
        Your only task is to analyze the given recipe and return a JSON object with the following properties:
        
        {
          "cook_length": (float in hours), 
          "difficulty": (one of: "easy", "moderate", "hard"),
          "portions": (integer, inferred from recipe size),
          "calories": (integer, estimated based on ingredient quantities)
        }

        **Important Rules:**
        - You must return only a valid JSON object, with no explanation, extra text, or markdown formatting.
        - Do not preface the response with any commentary. 
        - Do not include the words 'Here is the JSON output' or anything else—just output the JSON.
        - If the ingredient amounts are unclear, estimate using reasonable portion sizes.
        - Assume standard cooking times based on instructions.

        **Example Input:**
        {
          "title": "Creamy Garlic Chicken",
          "ingredients": [
            {"name": "chicken breast", "quantity": "250 g"},
            {"name": "butter", "quantity": "2 tablespoons"},
            {"name": "garlic", "quantity": "4 cloves"},
            {"name": "heavy cream", "quantity": "1 cup"},
            {"name": "parmesan cheese", "quantity": "0.5 cup"}
          ],
          "instructions": [
            "Season chicken and cook in butter until golden.",
            "Add garlic, cream, and parmesan; simmer for 10 minutes."
          ]
        }

        **Expected Output (and nothing else):**
        {
          "cook_length": 0.5,
          "difficulty": "moderate",
          "portions": 2,
          "calories": 1674
        }
        `;

        let responseContent = await getRecipeAnalysis(initialInstruction);

        responseContent = responseContent.replace(/^.*?({.*})\s*$/s, '$1');

        let parsedResponse;
        try {
            parsedResponse = JSON.parse(responseContent);
        } catch (error) {
            const refactorInstruction = `
            Your previous response contained extra text or was not formatted correctly as JSON.
            Please return only a valid JSON object with no additional text, markdown, or explanations.

            Remember, the output must strictly follow this structure:
            {
              "cook_length": (float in hours),
              "difficulty": (one of: "easy", "moderate", "hard"),
              "portions": (integer, inferred from recipe size),
              "calories": (integer, estimated based on ingredient quantities)
            }

            **Do not include any introduction or commentary, only return the valid JSON.**`;

            responseContent = await getRecipeAnalysis(refactorInstruction);
            
            responseContent = responseContent.replace(/^.*?({.*})\s*$/s, '$1');
            parsedResponse = JSON.parse(responseContent);
        }

        res.json(parsedResponse);

    } catch (error) {
        console.error('OpenAI API error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const recipeDescription = async (req, res) => {
    try {
        const recipe = req.body || null;

        if (!recipe) {
            return res.status(400).json({ error: 'Recipe is required' });
        }

        const getRecipeDescription = async (instruction) => {
            const completion = await openai.chat.completions.create({
                model: "deepseek/deepseek-r1-distill-llama-70b:free",
                messages: [
                    {
                        "role": "system",
                        "content": instruction
                    },
                    {
                        "role": "user",
                        "content": JSON.stringify(recipe)
                    }
                ]
            });

            return completion.choices[0].message.content.trim();
        };

        const initialInstruction = `
        You are a food writer. Given a recipe, write an enticing, mouthwatering description **strictly under 100 words**.

        **Rules:**
        - Do NOT exceed 100 words.
        - Make it sound delicious and inviting.
        - No introductions, just the description itself.

        **Example Input:**
        {
          "title": "Creamy Garlic Chicken",
          "ingredients": [
            {"name": "chicken breast", "quantity": "250 g"},
            {"name": "butter", "quantity": "2 tablespoons"},
            {"name": "garlic", "quantity": "4 cloves"},
            {"name": "heavy cream", "quantity": "1 cup"},
            {"name": "parmesan cheese", "quantity": "0.5 cup"}
          ],
          "instructions": [
            "Season chicken and cook in butter until golden.",
            "Add garlic, cream, and parmesan; simmer for 10 minutes."
          ]
        }

        **Expected Output (STRICTLY under 100 words):**
        "Succulent chicken breast seared to golden perfection, then bathed in a rich, garlicky cream sauce infused with butter, parmesan, and fragrant herbs. Every bite is indulgent and packed with flavor, perfect for a comforting yet elegant meal. Serve it over pasta or with warm, crusty bread to soak up the luscious sauce."
        `;

        let responseContent = await getRecipeDescription(initialInstruction);

        if (responseContent.split(" ").length > 155) {
            const refactorInstruction = `
            Your previous response was too long. Rewrite the description **STRICTLY under 150 words**. Do NOT exceed the limit.

            **Example Format (STRICT 100 words max):**
            "Golden-browned chicken in a rich garlic butter cream sauce, infused with parmesan and fresh herbs. Indulgent, flavorful, and a must-try dish!"

            **Do not include any introduction or commentary, return ONLY the description, nothing else.**
            `;

            responseContent = await getRecipeDescription(refactorInstruction);
        }

        responseContent = responseContent.trim();

        res.json({ description: responseContent });

    } catch (error) {
        console.error('OpenAI API error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



module.exports = { testAi, recipeDetails, recipeDescription };