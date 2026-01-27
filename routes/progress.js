const express = require('express');
const {
  getMyProgress,
  getStats,
  startResource,
  updateProgress,
  completeResource,
  saveResource,
  unsaveResource,
  getCompleted,
  getSaved
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/me', getMyProgress);
router.get('/stats', getStats);
router.get('/completed', getCompleted);
router.get('/saved', getSaved);

router.post('/start', startResource);
router.put('/update', updateProgress);
router.post('/complete', completeResource);
router.post('/save', saveResource);
router.delete('/save/:resourceId', unsaveResource);

module.exports = router;
