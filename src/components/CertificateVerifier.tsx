import { useState } from 'react';
import { Sparkles, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';

interface VerificationResult {
  isValid: boolean;
  businessNameMatch: boolean;
  idNumberMatch: boolean;
  certificateType: string;
  confidence: number;
  notes: string;
  redFlags: string[];
}

interface Props {
  certificateUrl: string;
  expectedBusinessName: string;
  expectedIdOrBrn: string;
  onVerificationComplete: (result: VerificationResult) => void;
}

export default function CertificateVerifier({
  certificateUrl,
  expectedBusinessName,
  expectedIdOrBrn,
  onVerificationComplete
}: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');

  const verifyCertificate = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch image and convert to base64
      const response = await fetch(certificateUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });

      const mediaType = blob.type || 'image/jpeg';

      // Call Claude API with the certificate image
      const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 }
              },
              {
                type: 'text',
                text: `You are a Kenyan business document verification expert. Analyze this document and verify:

Expected business name: "${expectedBusinessName}"
Expected ID/BRN number: "${expectedIdOrBrn}"

Please verify:
1. Does the business name on the document match "${expectedBusinessName}"?
2. Does the ID/registration number match "${expectedIdOrBrn}"?
3. What type of document is this? (National ID, Certificate of Incorporation, Business Registration, etc.)
4. Does the document appear authentic and unaltered?
5. Are there any red flags?

Respond ONLY with valid JSON in this exact format:
{
  "isValid": true/false,
  "businessNameMatch": true/false,
  "idNumberMatch": true/false,
  "certificateType": "document type",
  "confidence": 0-100,
  "notes": "brief explanation",
  "redFlags": ["list", "of", "issues"]
}`
              }
            ]
          }]
        })
      });

      const data = await aiResponse.json();
      const text = data.content[0].text;
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed: VerificationResult = JSON.parse(clean);
      setResult(parsed);
      onVerificationComplete(parsed);
    } catch (e) {
      setError('Verification failed. Please try again.');
      console.error(e);
    }

    setLoading(false);
  };

  return (
    <div className="border border-purple-100 rounded-xl bg-purple-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={18} className="text-purple-600" />
        <span className="font-semibold text-purple-800 text-sm">AI Certificate Verification</span>
      </div>

      {!result && !loading && (
        <button
          onClick={verifyCertificate}
          className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
        >
          Verify certificate with AI
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-purple-600">
          <Loader size={16} className="animate-spin" />
          <span className="text-sm">AI is analyzing the certificate...</span>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {result && (
        <div className="space-y-3">
          {/* Overall result */}
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            result.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {result.isValid
              ? <CheckCircle size={20} className="text-green-600" />
              : <XCircle size={20} className="text-red-600" />
            }
            <div>
              <div className={`font-semibold text-sm ${result.isValid ? 'text-green-700' : 'text-red-700'}`}>
                {result.isValid ? 'Document appears valid' : 'Document has issues'}
              </div>
              <div className="text-xs text-gray-500">
                Confidence: {result.confidence}% · {result.certificateType}
              </div>
            </div>
          </div>

          {/* Checks */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
              result.businessNameMatch ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {result.businessNameMatch
                ? <CheckCircle size={14} />
                : <XCircle size={14} />
              }
              Business name {result.businessNameMatch ? 'matches' : 'mismatch'}
            </div>
            <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
              result.idNumberMatch ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {result.idNumberMatch
                ? <CheckCircle size={14} />
                : <XCircle size={14} />
              }
              ID/BRN {result.idNumberMatch ? 'matches' : 'mismatch'}
            </div>
          </div>

          {/* Notes */}
          <p className="text-xs text-gray-600 bg-white rounded-lg p-2">{result.notes}</p>

          {/* Red flags */}
          {result.redFlags.length > 0 && (
            <div className="space-y-1">
              {result.redFlags.map((flag, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-600">
                  <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                  {flag}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={verifyCertificate}
            className="text-xs text-purple-600 hover:underline"
          >
            Re-verify
          </button>
        </div>
      )}
    </div>
  );
}
