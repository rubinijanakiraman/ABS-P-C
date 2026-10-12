import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function generateContentWithFallback(params: Omit<Parameters<typeof ai.models.generateContent>[0], 'model'>) {
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model,
      });
      return response;
    } catch (err: any) {
      console.warn(`Model ${model} attempt failed:`, err?.message || err);
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // API Route: Validate Document Line of Business
  app.post('/api/gemini/validate-lob', async (req, res) => {
    try {
      const { documentText } = req.body;
      const prompt = `
        You are an Insurance Document Classification Agent.
        Your task is to determine the Line of Business (LOB) of a document using the extracted text.

        LOB KEYWORD REFERENCE:
        Property & Casualty (Target LOB): property damage, building coverage, natural disaster claim, fire damage, flood damage, liability coverage, third-party liability, accident claim, vehicle insurance, motor insurance
        Life Insurance: life insurance, policyholder, beneficiary, nominee, premium payment, premium lapse, grace period, surrender value, paid-up value, policy maturity, policy reinstatement, underwriting, medical underwriting, mortality risk, evidence of insurability, underwriting decision, paramedical report, death claim, death certificate, claim settlement, beneficiary payout, contestability period, policy issuance, insurance agent, insurance advisor, proposal form, financial advisor, annuity, endowment policy, term life, whole life, universal life
        Health Insurance: hospitalization, inpatient treatment, outpatient treatment, deductible, copay, health coverage, medical network, TPA, surgery cost, treatment cost, hospital bill, medical reimbursement
        Reinsurance: treaty, facultative, reinsurer, reinsurance contract, ceded risk, reinsurance placement, portfolio risk transfer
        Banking: loan application, credit approval, loan underwriting, EMI payment, mortgage loan, personal loan, credit risk assessment, KYC verification, account opening, savings account, current account, banking transaction, loan servicing, loan disbursement, credit bureau check, collateral verification
        Personal Accident (PA): personal accident policy, accidental death benefit, accidental disability, accidental injury claim, accidental hospitalization, permanent disability benefit, temporary disability benefit, accident coverage, accidental loss of limb, accidental death payout, accidental claim settlement

        CLASSIFICATION RULES:
        1. Count keyword matches for each LOB.
        2. Select the LOB with the highest keyword count.
        3. If keywords are insufficient or tied, use your internal agent intelligence to infer the LOB from the overall context, terminology, and document structure.
        4. IMPORTANT: If the detected LOB is Personal Accident (PA), you MUST mark it as "Property & Casualty" in the "lob_detected" field.
        5. If Property & Casualty (including those mapped from Personal Accident) is the primary LOB -> APPROVED.
        6. If any other LOB (Life, Health, Reinsurance, Banking) is primary -> REJECTED.
        7. If no clear LOB can be determined even with intelligence -> UNKNOWN.

        DOCUMENT INPUT:
        ${documentText || ''}

        Return results in strict JSON format only. Include a "reason" field explaining why the LOB was selected and why the status is APPROVED or REJECTED.
      `;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lob_detected: { type: Type.STRING },
              keyword_scores: {
                type: Type.OBJECT,
                properties: {
                  property_casualty: { type: Type.NUMBER },
                  life_insurance: { type: Type.NUMBER },
                  health_insurance: { type: Type.NUMBER },
                  banking: { type: Type.NUMBER },
                  personal_accident: { type: Type.NUMBER },
                  reinsurance: { type: Type.NUMBER },
                },
                required: [
                  'property_casualty',
                  'life_insurance',
                  'health_insurance',
                  'banking',
                  'personal_accident',
                  'reinsurance',
                ],
              },
              status: { type: Type.STRING },
              confidence: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
            required: ['lob_detected', 'keyword_scores', 'status', 'confidence', 'reason'],
          },
        },
      });

      const cleanJson = (response.text || '{}')
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      return res.json(JSON.parse(cleanJson));
    } catch (error: any) {
      console.error('Server Validate LOB error:', error?.message || error);
      return res.status(500).json({ error: error?.message || 'Failed to validate LOB' });
    }
  });

  // API Route: Analyze Process Intelligence
  app.post('/api/gemini/analyze-process', async (req, res) => {
    try {
      const { documents } = req.body;
      if (!Array.isArray(documents) || documents.length === 0) {
        return res.status(400).json({ error: 'No documents provided' });
      }

      const parts: any[] = [];
      const promptText = `
        You are an Insurance Process Intelligence Agent.
        Analyze the following process documents (including text and any block diagrams or visual flows) and classify them into the L1, L2, L3 process taxonomy.
        Then generate a Current State and an Agentic Led Future State.

        PROCESS TAXONOMY:
        1. Insurance Value Chain:
           - Distribution: Digitize Experience for Top Brokers, Accelerated MGA Onboarding
           - Underwriting: Underwriting Renewal Management, New Business Submission & Triage, Servicing & Endorsement Automation, Automated Book & Issue, UW Data Gathering, Renewal Auto Prep, Premium Audit, UW Quality Audit, Concentration Analysis, Onboarding New Insurance products, Risk Engineering Review
           - Claims: Digital FNOL & Triage, Summarization for Decision Support, AI Driven Document Management, Medical Management, Legal - Litigation Management, AI Assist Language Translation for FNOL, Payments COE, Recovery Section, Claims Servicing, AI-Led Claims Quality Audit, Claim Recoveries
           - Reinsurance: Treaty Placement, Contracts Management, Facultative Placement, Portfolio Assessment, Reinsurer Profile Analysis, Broker Analysis
        2. Corporate Functions:
           - Actuarial: Company Strength, Reserving Method Selection, Claims ML for IBNR, Dynamic Actuarial Pricing, CAT Modeling, CAT Monitoring, Portfolio Reporting
           - HR: AI & Gen AI learning, Ask HR, Employee self service, Candidate Onboarding
           - Legal: Legal Front Door, Regulatory Change Platform, Contract generation & Analytics
           - Technology: Core Platform Recommendations, Infra Servicing, AI Ops
           - Data: Agents for Data Migration, Agents for Data Modernization, Agents for Data Management & Governance

        TASK: Extract the current insurance business process workflow from the uploaded document.

        INSTRUCTIONS:
        1. Read the entire document (including all text and visual block diagrams) before generating the output.
        2. If the document contains multiple tabs, sheets, pages, or diagrams, analyze all of them.
        3. Extract the Current State process only from the content present in the document.
        4. Provide a detailed, step-by-step breakdown of the process flow.
        5. For each step, identify the Actor/Role, Action, Input/Output, and any Systems used if mentioned.
        6. Capture decision points, conditional branches, and exception paths explicitly.
        7. If a block diagram or flowchart is present, interpret the flow, decision diamonds, and swimlanes to accurately capture the process.
        8. Do NOT generate or assume information that is not explicitly mentioned in the document.
        9. If required information is missing, return: "Not found in document".
        10. Consolidate information from all sources (text and diagrams) to produce the most accurate and detailed Current State process.

        OUTPUT FORMAT:
        - Provide each step as a clear sentence or description.
        - Do NOT include prefixes like "Step 1:", "Step 2:", etc.
        - Do NOT include labels like "Actor:", "Action:", "Input:", "Output:".
        - Instead, incorporate these details naturally into the descriptive sentence for each step.
        - Example: "The Underwriter reviews the submission documents in the Guidewire system to assess risk."

        TASK: Generate the Agentic Led Future State.
        INSTRUCTIONS:
        1. The Future State MUST be based on the Current State points identified above.
        2. For EACH point in the Current State, define a simple, to-the-point Agentic improvement.
        3. Use bullet points and simple English.
        4. Focus on how AI agents (Orchestrator, Super, Utility) can make the process faster or easier.
        5. Keep the explanations clear and easy to understand.
      `;

      parts.push({ text: promptText });

      documents.forEach((doc: any) => {
        parts.push({
          text: `\n\n--- Document: ${doc.document_name} ---\nContent:\n${doc.content}\n`,
        });
        if (doc.visualParts && Array.isArray(doc.visualParts)) {
          doc.visualParts.forEach((vp: any) => {
            parts.push({
              inlineData: {
                data: vp.base64Data,
                mimeType: vp.mimeType,
              },
            });
          });
        }
      });

      parts.push({
        text: '\n\nReturn STRICT JSON OUTPUT ONLY matching the AnalysisResult interface.',
      });

      const response = await generateContentWithFallback({
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              documents: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    document_name: { type: Type.STRING },
                    file_type: { type: Type.STRING },
                    file_size_mb: { type: Type.NUMBER },
                    size_validation: { type: Type.STRING },
                    lob_detected: { type: Type.STRING },
                    keyword_scores: {
                      type: Type.OBJECT,
                      properties: {
                        life_insurance: { type: Type.NUMBER },
                        health_insurance: { type: Type.NUMBER },
                        property_casualty: { type: Type.NUMBER },
                        reinsurance: { type: Type.NUMBER },
                        banking: { type: Type.NUMBER },
                        personal_accident: { type: Type.NUMBER },
                      },
                    },
                    status: { type: Type.STRING },
                    enable_analyze_button: { type: Type.BOOLEAN },
                  },
                },
              },
              process_classification: {
                type: Type.OBJECT,
                properties: {
                  l1: { type: Type.STRING },
                  l2: { type: Type.STRING },
                  l3: { type: Type.STRING },
                },
              },
              process_transformation: {
                type: Type.OBJECT,
                properties: {
                  current_state: { type: Type.ARRAY, items: { type: Type.STRING } },
                  agentic_led_future_state: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
            },
          },
        },
      });

      const cleanJson = (response.text || '{}')
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      return res.json(JSON.parse(cleanJson));
    } catch (error: any) {
      console.error('Server Process Intelligence error:', error?.message || error);
      return res.status(500).json({ error: error?.message || 'Failed to analyze process' });
    }
  });

  // API Route: Generate Opportunity Transformation Details
  app.post('/api/gemini/opportunity-details', async (req, res) => {
    try {
      const { opportunityName, categoryName } = req.body;
      const prompt = `
        Act as a senior insurance technology transformation consultant. 
        Analyze this opportunity for an Agentic AI implementation:
        
        Task/Opportunity: "${opportunityName}"
        Insurance Function: "${categoryName}"
        
        Return a structured JSON object. Use simple English and keep points to the point.
        1. value: { summary: string (simple summary), highlights: { label: string, value: string }[] (key benefits) }
        2. process: { 
             current: string[] (current steps as descriptive sentences, no "Step X:" or "Actor:" prefixes), 
             future: string[] (improved steps with AI as descriptive sentences) 
           } 
        3. dataProducts: { apps: string[], elements: string[], products: string[] }
        4. workTransformation: { personas: { role: string, tasks: { name: string, current: number, future: number }[] }[] } (Generate at least 3-4 distinct roles/personas relevant to this opportunity, rather than just 2)
        5. agenticSolution: { 
             steps: { title: string, agentType: string, description: string }[] (10-15 clear steps),
             orchestratorAgents: string[],
             superAgents: string[],
             utilityAgents: string[]
           }

        IMPORTANT:
        - Use simple English.
        - Keep all points clear and easy to understand.
        - For agenticSolution, follow the hierarchy: Orchestrator -> Super-Agent -> Utility-Agents.
        - For workTransformation, ensure you generate at least 3 to 4 distinct, highly relevant roles or personas (e.g., Associate, Manager, Analyst, Specialist, Auditor, etc.) that participate in or are impacted by this business process, outlining 3-4 specific tasks for each with their current and future time focus percentages.
      `;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              value: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  highlights: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        value: { type: Type.STRING },
                      },
                      required: ['label', 'value'],
                    },
                  },
                },
                required: ['summary', 'highlights'],
              },
              process: {
                type: Type.OBJECT,
                properties: {
                  current: { type: Type.ARRAY, items: { type: Type.STRING } },
                  future: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['current', 'future'],
              },
              dataProducts: {
                type: Type.OBJECT,
                properties: {
                  apps: { type: Type.ARRAY, items: { type: Type.STRING } },
                  elements: { type: Type.ARRAY, items: { type: Type.STRING } },
                  products: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['apps', 'elements', 'products'],
              },
              workTransformation: {
                type: Type.OBJECT,
                properties: {
                  personas: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        role: { type: Type.STRING },
                        tasks: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              name: { type: Type.STRING },
                              current: { type: Type.NUMBER },
                              future: { type: Type.NUMBER },
                            },
                            required: ['name', 'current', 'future'],
                          },
                        },
                      },
                      required: ['role', 'tasks'],
                    },
                  },
                },
                required: ['personas'],
              },
              agenticSolution: {
                type: Type.OBJECT,
                properties: {
                  steps: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        agentType: { type: Type.STRING },
                        description: { type: Type.STRING },
                      },
                      required: ['title', 'agentType', 'description'],
                    },
                  },
                  orchestratorAgents: { type: Type.ARRAY, items: { type: Type.STRING } },
                  superAgents: { type: Type.ARRAY, items: { type: Type.STRING } },
                  utilityAgents: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['steps', 'orchestratorAgents', 'superAgents', 'utilityAgents'],
              },
            },
            required: ['value', 'process', 'dataProducts', 'workTransformation', 'agenticSolution'],
          },
        },
      });

      const cleanJson = (response.text || '{}')
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      return res.json(JSON.parse(cleanJson));
    } catch (error: any) {
      console.error('Server Opportunity Details error:', error?.message || error);
      return res.status(500).json({ error: error?.message || 'Failed to generate opportunity details' });
    }
  });

  // Client routing: dev middleware or static dist
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
