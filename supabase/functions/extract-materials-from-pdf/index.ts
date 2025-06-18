
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MaterialExtraction {
  name: string;
  tag?: string;
  manufacturer_name?: string;
  category: string;
  subcategory?: string;
  location?: string;
  reference_model_sku?: string;
  dimensions?: string;
  notes?: string;
}

interface ManufacturerGroup {
  manufacturer_name: string;
  materials: MaterialExtraction[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('PDF extraction function called')
    
    const formData = await req.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const clientId = formData.get('clientId') as string
    const studioId = formData.get('studioId') as string

    console.log('Form data received:', { 
      hasFile: !!file, 
      projectId, 
      clientId, 
      studioId,
      fileType: file?.type,
      fileSize: file?.size 
    })

    if (!file || !studioId) {
      console.error('Missing required fields:', { hasFile: !!file, studioId })
      return new Response(
        JSON.stringify({ error: 'File and studio ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert file to base64 for OpenRouter/Gemini
    const arrayBuffer = await file.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    console.log('File converted to base64, length:', base64.length)
    
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!openRouterApiKey) {
      console.error('OpenRouter API key not found in environment')
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key not configured. Please add OPENROUTER_API_KEY to Supabase Edge Function Secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('OpenRouter API key found, making request...')

    // Call Gemini 2.0 Flash Experimental through OpenRouter for material extraction
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://treqy.lovable.app',
        'X-Title': 'Treqy Material Library',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract all materials information from this architectural finish schedule PDF and return them as a JSON object grouped by manufacturer_name. Each material should have:

- name (from "Material" column)
- tag (from "Key" column) 
- manufacturer_name (from "Manufacturer" column, or "UNSPECIFIED MANUFACTURER" if blank)
- category and subcategory (deduced from the material type or inferred from context)
- location (if specified)
- reference_model_sku (from "Size" or "Color/Finish" if applicable)
- dimensions (if specified)
- notes (from "Description/Comments")

Important rules:
- If the material contains "NOT USED", skip it
- If no manufacturer is listed, set "manufacturer_name": "UNSPECIFIED MANUFACTURER"
- Group all materials by their manufacturer_name key
- Return as one clean JSON object (no markdown)
- I expect around 100-120 materials total

Return the data in this exact format:
[
  {
    "manufacturer_name": "MANUFACTURER_NAME",
    "materials": [
      {
        "name": "material name",
        "tag": "key code",
        "category": "category",
        "subcategory": "subcategory",
        "location": "location",
        "reference_model_sku": "sku/model",
        "dimensions": "dimensions",
        "notes": "notes"
      }
    ]
  }
]`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${file.type};base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      })
    })

    console.log('OpenRouter response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error:', errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to process PDF with AI', 
          details: errorText,
          status: response.status 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiResponse = await response.json()
    console.log('AI response received:', { 
      hasChoices: !!aiResponse.choices, 
      choicesLength: aiResponse.choices?.length 
    })
    
    const extractedText = aiResponse.choices[0].message.content

    // Parse the JSON response from AI
    let extractedData: ManufacturerGroup[]
    try {
      // Clean the response to extract just the JSON
      const jsonMatch = extractedText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.error('No valid JSON found in AI response:', extractedText)
        throw new Error('No valid JSON found in AI response')
      }
      extractedData = JSON.parse(jsonMatch[0])
      console.log('Successfully parsed JSON, groups:', extractedData.length)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('AI response was:', extractedText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse extracted materials', 
          aiResponse: extractedText,
          details: parseError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Extraction successful:', {
      totalGroups: extractedData.length,
      totalMaterials: extractedData.reduce((sum, group) => sum + group.materials.length, 0)
    })

    // Return the extracted data for user approval
    return new Response(
      JSON.stringify({
        success: true,
        extractedMaterials: extractedData,
        totalMaterials: extractedData.reduce((sum, group) => sum + group.materials.length, 0),
        projectId,
        clientId,
        studioId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in extract-materials-from-pdf function:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
