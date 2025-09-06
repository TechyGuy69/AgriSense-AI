import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FieldData {
  ndvi: number;
  gndvi: number;
  temperature: number;
  soilMoisture: number;
  vpd: number;
  fieldSize: number;
  cropType: string;
  growthStage: string;
  lastRainfall: number;
  humidity: number;
}

interface PredictionRequest {
  fieldData: FieldData;
  predictionType: 'trends' | 'insights' | 'risk_assessment';
  timeframe: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fieldData, predictionType, timeframe }: PredictionRequest = await req.json();

    console.log('AI Prediction Request:', { predictionType, timeframe, fieldData });

    // Create specialized prompts based on prediction type
    let systemPrompt = '';
    let userPrompt = '';

    if (predictionType === 'trends') {
      systemPrompt = `You are an expert agricultural AI analyst specializing in crop health trends and time-series prediction. 
      Analyze the provided field data to generate accurate trend predictions and vegetation index forecasts.
      Return only valid JSON with specific numerical predictions and trend analysis.`;

      userPrompt = `Analyze this field data and predict trends for the next ${timeframe}:
      
      Current Field Data:
      - NDVI: ${fieldData.ndvi}
      - GNDVI: ${fieldData.gndvi}
      - Temperature: ${fieldData.temperature}°C
      - Soil Moisture: ${fieldData.soilMoisture}%
      - VPD: ${fieldData.vpd} kPa
      - Crop Type: ${fieldData.cropType}
      - Growth Stage: ${fieldData.growthStage}
      - Last Rainfall: ${fieldData.lastRainfall}mm
      - Humidity: ${fieldData.humidity}%

      Return JSON with this exact structure:
      {
        "predicted_ndvi": { "value": number, "change_percent": number, "confidence": number },
        "predicted_gndvi": { "value": number, "change_percent": number, "confidence": number },
        "predicted_vpd": { "value": number, "change_percent": number, "confidence": number },
        "risk_score": { "level": "Low|Medium|High", "trend": "Improving|Stable|Declining", "confidence": number },
        "environmental_forecast": {
          "temperature_range": { "min": number, "max": number },
          "soil_moisture_prediction": number,
          "irrigation_needed": boolean
        },
        "trend_summary": {
          "positive_trends": [string],
          "concerning_trends": [string],
          "stable_conditions": [string]
        }
      }`;
    } else if (predictionType === 'insights') {
      systemPrompt = `You are an expert agricultural AI consultant specializing in actionable crop management insights.
      Analyze field conditions to identify risk drivers and provide specific, prioritized recommendations.
      Focus on practical actions farmers can take based on current conditions.`;

      userPrompt = `Analyze this field data and provide actionable insights:
      
      Current Field Data:
      - NDVI: ${fieldData.ndvi}
      - GNDVI: ${fieldData.gndvi}
      - Temperature: ${fieldData.temperature}°C
      - Soil Moisture: ${fieldData.soilMoisture}%
      - VPD: ${fieldData.vpd} kPa
      - Field Size: ${fieldData.fieldSize} hectares
      - Crop Type: ${fieldData.cropType}
      - Growth Stage: ${fieldData.growthStage}
      - Last Rainfall: ${fieldData.lastRainfall}mm
      - Humidity: ${fieldData.humidity}%

      Return JSON with this exact structure:
      {
        "top_risk_drivers": [
          {
            "factor": string,
            "impact": "High|Medium|Low",
            "trend": string,
            "description": string,
            "icon_type": "moisture|temperature|wind|nutrition|disease",
            "current_value": number,
            "optimal_range": string
          }
        ],
        "action_recommendations": [
          {
            "priority": "High|Medium|Low",
            "title": string,
            "description": string,
            "urgency": "urgent|moderate|routine",
            "actions": [string],
            "expected_outcome": string,
            "timeframe": string
          }
        ],
        "model_confidence": {
          "risk_assessment": number,
          "data_quality": number,
          "prediction_reliability": number
        }
      }`;
    } else if (predictionType === 'risk_assessment') {
      systemPrompt = `You are an expert agricultural risk assessment AI. Analyze field conditions to predict potential risks
      and provide early warning systems for crop management. Focus on preventing issues before they become critical.`;

      userPrompt = `Perform comprehensive risk assessment for this field:
      
      Current Field Data:
      - NDVI: ${fieldData.ndvi}
      - GNDVI: ${fieldData.gndvi}
      - Temperature: ${fieldData.temperature}°C
      - Soil Moisture: ${fieldData.soilMoisture}%
      - VPD: ${fieldData.vpd} kPa
      - Crop Type: ${fieldData.cropType}
      - Growth Stage: ${fieldData.growthStage}
      - Last Rainfall: ${fieldData.lastRainfall}mm

      Return JSON with this exact structure:
      {
        "overall_risk_level": "Low|Medium|High|Critical",
        "risk_factors": [
          {
            "type": string,
            "severity": "Low|Medium|High|Critical",
            "probability": number,
            "description": string,
            "mitigation_actions": [string]
          }
        ],
        "early_warnings": [
          {
            "alert_type": string,
            "urgency": "immediate|24h|48h|7days",
            "message": string,
            "recommended_action": string
          }
        ],
        "field_health_score": {
          "overall": number,
          "vegetation_health": number,
          "water_stress": number,
          "environmental_stress": number
        }
      }`;
    }

    if (!geminiApiKey) {
      throw new Error('Missing GEMINI_API_KEY secret');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    console.log('AI Response:', aiText);

    // Attempt to parse JSON from the AI text
    let parsedResponse: any;
    try {
      const match = aiText.match(/```json\s*([\s\S]*?)```/i) || aiText.match(/\{[\s\S]*\}$/);
      const jsonStr = match ? (match[1] ?? match[0]) : aiText;
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error('Invalid JSON response from AI model');
    }

    // Add metadata
    const finalResponse = {
      ...parsedResponse,
      generated_at: new Date().toISOString(),
      prediction_type: predictionType,
      timeframe,
      model_version: 'gemini-1.5-flash',
      confidence_level: 'high'
    };

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-crop-predictions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});