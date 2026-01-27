const express = require('express');
const {
  generatePath,
  getMyPaths,
  getPath,
  completePathResource,
  updatePathStatus,
  deletePath
} = require('../controllers/personalizedPathController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/generate', generatePath);
router.get('/my-paths', getMyPaths);
router.get('/:id', getPath);
router.post('/:id/complete-resource', completePathResource);
router.put('/:id/status', updatePathStatus);
router.delete('/:id', deletePath);

module.exports = router;
