const express = require('express');
const { PROFESSIONAL_MODELS, POSES, GARMENT_TYPES } = require('../config/models');

const router = express.Router();

/**
 * GET /api/models
 * Get all available models
 */
router.get('/', (req, res) => {
  try {
    const models = Object.values(PROFESSIONAL_MODELS).map(model => ({
      id: model.id,
      name: model.name,
      type: model.type,
      isPrimary: model.isPrimary,
      avatar: model.avatar,
      description: model.description,
      availablePoses: model.availablePoses.map(poseId => ({
        id: poseId,
        name: POSES[poseId]?.name || poseId,
        description: POSES[poseId]?.description || ''
      }))
    }));

    res.json({
      success: true,
      models: models,
      totalCount: models.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/models/:modelId
 * Get specific model details
 */
router.get('/:modelId', (req, res) => {
  try {
    const { modelId } = req.params;
    const model = PROFESSIONAL_MODELS[modelId];

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    // Return detailed model information
    res.json({
      success: true,
      model: {
        ...model,
        availablePoses: model.availablePoses.map(poseId => ({
          id: poseId,
          name: POSES[poseId]?.name || poseId,
          description: POSES[poseId]?.description || '',
          prompt: POSES[poseId]?.prompt || ''
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/models/poses/all
 * Get all available poses
 */
router.get('/poses/all', (req, res) => {
  try {
    const poses = Object.entries(POSES).map(([id, pose]) => ({
      id,
      ...pose
    }));

    res.json({
      success: true,
      poses: poses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/models/garments/types
 * Get all garment types
 */
router.get('/garments/types', (req, res) => {
  try {
    const garmentTypes = Object.entries(GARMENT_TYPES).map(([id, garment]) => ({
      id,
      ...garment
    }));

    res.json({
      success: true,
      garmentTypes: garmentTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/models/:modelId/poses
 * Get available poses for specific model
 */
router.get('/:modelId/poses', (req, res) => {
  try {
    const { modelId } = req.params;
    const model = PROFESSIONAL_MODELS[modelId];

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    const modelPoses = model.availablePoses.map(poseId => ({
      id: poseId,
      name: POSES[poseId]?.name || poseId,
      description: POSES[poseId]?.description || '',
      prompt: POSES[poseId]?.prompt || ''
    }));

    res.json({
      success: true,
      modelId: modelId,
      poses: modelPoses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/models/:modelId/validate
 * Validate model and pose combination
 */
router.post('/:modelId/validate', (req, res) => {
  try {
    const { modelId } = req.params;
    const { pose, providerId } = req.body;

    const model = PROFESSIONAL_MODELS[modelId];
    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    const errors = [];

    // Validate pose
    if (pose && !model.availablePoses.includes(pose)) {
      errors.push(`Pose '${pose}' not available for model '${modelId}'`);
    }

    // Validate provider compatibility
    if (providerId) {
      const providerValidation = aiService.validateProviderCapabilities(providerId, {});
      if (!providerValidation.isValid) {
        errors.push(...providerValidation.errors);
      }
    }

    res.json({
      success: errors.length === 0,
      modelId: modelId,
      isValid: errors.length === 0,
      errors: errors,
      availablePoses: model.availablePoses,
      recommendedPose: model.availablePoses[0] // First pose as default
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;