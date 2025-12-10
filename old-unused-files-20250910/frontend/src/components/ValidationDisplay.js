import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye, 
  Target, 
  Palette, 
  Shirt, 
  Badge,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Zap
} from 'lucide-react';

const ValidationDisplay = ({ 
  validationResult = null, 
  isValidating = false,
  onRetryRequest = null,
  showComparison = false,
  previousResult = null
}) => {
  const [animatedScores, setAnimatedScores] = useState({});
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    if (validationResult) {
      // Animate score changes
      const scores = {
        overall: validationResult.overallQuality || 0,
        consistency: validationResult.consistency?.overallScore || 0,
        accuracy: validationResult.accuracy?.overallScore || 0,
        face: validationResult.consistency?.faceConsistency || 0,
        pose: validationResult.consistency?.poseAccuracy || 0,
        color: validationResult.accuracy?.colorAccuracy || 0,
        style: validationResult.accuracy?.styleAccuracy || 0,
        branding: validationResult.accuracy?.brandingAccuracy || 0
      };

      // Animate each score
      Object.entries(scores).forEach(([key, targetValue]) => {
        let currentValue = animatedScores[key] || 0;
        const increment = (targetValue - currentValue) / 20;
        
        const animate = () => {
          currentValue += increment;
          if (Math.abs(currentValue - targetValue) < 0.01) {
            currentValue = targetValue;
          }
          
          setAnimatedScores(prev => ({ ...prev, [key]: currentValue }));
          
          if (currentValue !== targetValue) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
      });
    }
  }, [validationResult]);

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score) => {
    if (score >= 0.8) return CheckCircle;
    if (score >= 0.6) return AlertCircle;
    return XCircle;
  };

  const ScoreMeter = ({ label, score, icon: Icon, description, threshold = 0.6 }) => {
    const animatedScore = animatedScores[label.toLowerCase().replace(' ', '')] || 0;
    const percentage = Math.round(animatedScore * 100);
    const ScoreIcon = getScoreIcon(animatedScore);
    const colorClass = getScoreColor(animatedScore);
    const passes = animatedScore >= threshold;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Icon className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">{label}</span>
          </div>
          <div className="flex items-center space-x-2">
            <ScoreIcon className={`w-5 h-5 ${passes ? 'text-green-600' : 'text-red-600'}`} />
            <span className={`text-lg font-bold ${colorClass.split(' ')[0]}`}>
              {percentage}%
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                passes ? 'bg-green-500' : animatedScore >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {/* Threshold indicator */}
          <div 
            className="absolute top-0 w-0.5 h-3 bg-gray-400"
            style={{ left: `${threshold * 100}%` }}
          />
        </div>
        
        <p className="text-sm text-gray-600 mt-2">{description}</p>
        
        {/* Comparison with previous result */}
        {showComparison && previousResult && (
          <div className="mt-2 flex items-center space-x-1 text-xs">
            {animatedScore > (previousResult[label.toLowerCase().replace(' ', '')] || 0) ? (
              <>
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-green-600">Improved</span>
              </>
            ) : animatedScore < (previousResult[label.toLowerCase().replace(' ', '')] || 0) ? (
              <>
                <TrendingDown className="w-3 h-3 text-red-600" />
                <span className="text-red-600">Decreased</span>
              </>
            ) : (
              <span className="text-gray-500">No change</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const DetailedBreakdown = ({ title, data, icon: Icon }) => {
    if (!data) return null;

    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Icon className="w-4 h-4 text-gray-600" />
          <h4 className="font-medium text-gray-900">{title}</h4>
        </div>
        
        <div className="space-y-2">
          {Object.entries(data).map(([key, value]) => {
            if (typeof value === 'object') return null;
            const score = typeof value === 'number' ? value : 0;
            const percentage = Math.round(score * 100);
            
            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getScoreColor(score).includes('green') ? 'bg-green-500' : 
                        getScoreColor(score).includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isValidating) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center space-x-3">
          <RefreshCw className="w-6 h-6 text-orange-600 animate-spin" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Validating Quality</h3>
            <p className="text-sm text-gray-600">Analyzing generated image quality...</p>
          </div>
        </div>
        
        <div className="mt-6 space-y-3">
          {['Model Consistency', 'Product Accuracy', 'Overall Quality'].map((step, index) => (
            <div key={step} className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${
                index === 0 ? 'bg-orange-600 animate-pulse' : 'bg-gray-200'
              }`} />
              <span className={`text-sm ${index === 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!validationResult) {
    return (
      <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Validation Results</h3>
        <p className="text-gray-600">Generate an image to see quality validation results</p>
      </div>
    );
  }

  const overallPasses = validationResult.passes;
  const overallScore = animatedScores.overall || 0;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`rounded-lg p-6 ${
        overallPasses ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {overallPasses ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
            <div>
              <h3 className={`text-xl font-bold ${
                overallPasses ? 'text-green-900' : 'text-red-900'
              }`}>
                {overallPasses ? 'Quality Validation Passed' : 'Quality Validation Failed'}
              </h3>
              <p className={`text-sm ${
                overallPasses ? 'text-green-700' : 'text-red-700'
              }`}>
                Overall Quality Score: {Math.round(overallScore * 100)}%
              </p>
            </div>
          </div>
          
          {!overallPasses && onRetryRequest && (
            <button
              onClick={onRetryRequest}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Generation</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScoreMeter
          label="Model Consistency"
          score={validationResult.consistency?.overallScore || 0}
          icon={Eye}
          description="How well the model's appearance is preserved"
          threshold={validationResult.thresholds?.consistency?.overall || 0.6}
        />
        
        <ScoreMeter
          label="Product Accuracy"
          score={validationResult.accuracy?.overallScore || 0}
          icon={Target}
          description="How accurately the product is represented"
          threshold={validationResult.thresholds?.accuracy?.overall || 0.6}
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreMeter
          label="Face Consistency"
          score={validationResult.consistency?.faceConsistency || 0}
          icon={Eye}
          description="Facial feature preservation"
          threshold={validationResult.thresholds?.consistency?.face || 0.65}
        />
        
        <ScoreMeter
          label="Pose Accuracy"
          score={validationResult.consistency?.poseAccuracy || 0}
          icon={Target}
          description="Pose matching accuracy"
          threshold={validationResult.thresholds?.consistency?.pose || 0.55}
        />
        
        <ScoreMeter
          label="Color Matching"
          score={validationResult.accuracy?.colorAccuracy || 0}
          icon={Palette}
          description="Product color accuracy"
          threshold={validationResult.thresholds?.accuracy?.color || 0.65}
        />
        
        <ScoreMeter
          label="Style Preservation"
          score={validationResult.accuracy?.styleAccuracy || 0}
          icon={Shirt}
          description="Garment style and fit"
          threshold={validationResult.thresholds?.accuracy?.style || 0.55}
        />
      </div>

      {/* Branding Quality (if applicable) */}
      {validationResult.accuracy?.brandingAccuracy !== undefined && (
        <div className="grid grid-cols-1">
          <ScoreMeter
            label="Branding Quality"
            score={validationResult.accuracy.brandingAccuracy}
            icon={Badge}
            description="Logo and text visibility and accuracy"
            threshold={validationResult.thresholds?.accuracy?.branding || 0.75}
          />
        </div>
      )}

      {/* Expandable Detailed Breakdowns */}
      <div className="space-y-4">
        <button
          onClick={() => setExpandedSection(expandedSection === 'consistency' ? null : 'consistency')}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">Consistency Details</span>
          </div>
          <span className="text-sm text-gray-600">
            {Math.round((validationResult.consistency?.overallScore || 0) * 100)}%
          </span>
        </button>

        {expandedSection === 'consistency' && (
          <DetailedBreakdown
            title="Model Consistency Breakdown"
            data={validationResult.consistency}
            icon={Eye}
          />
        )}

        <button
          onClick={() => setExpandedSection(expandedSection === 'accuracy' ? null : 'accuracy')}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-green-600" />
            <span className="font-medium text-gray-900">Accuracy Details</span>
          </div>
          <span className="text-sm text-gray-600">
            {Math.round((validationResult.accuracy?.overallScore || 0) * 100)}%
          </span>
        </button>

        {expandedSection === 'accuracy' && (
          <DetailedBreakdown
            title="Product Accuracy Breakdown"
            data={validationResult.accuracy}
            icon={Target}
          />
        )}
      </div>

      {/* Feedback and Recommendations */}
      {validationResult.feedback && validationResult.feedback.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Quality Feedback</span>
          </h4>
          <div className="space-y-2">
            {validationResult.feedback.map((feedback, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2" />
                <p className="text-sm text-blue-800">{feedback}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Time */}
      {validationResult.processingTime && (
        <div className="text-center text-sm text-gray-500">
          Validation completed in {validationResult.processingTime}ms
        </div>
      )}
    </div>
  );
};

export default ValidationDisplay;