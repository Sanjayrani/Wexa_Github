'use strict';

const express = require('express');
const router  = express.Router();

const authMiddleware  = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const healthController     = require('../controllers/healthController');
const triggerController    = require('../controllers/triggerController');
const runsController       = require('../controllers/runsController');
const ticketsController    = require('../controllers/ticketsController');
const developersController = require('../controllers/developersController');
const configController     = require('../controllers/configController');

router.get('/health', healthController.check);

router.post('/trigger',           authMiddleware, triggerController.trigger);
router.get('/runs',               authMiddleware, runsController.list);
router.get('/runs/:id',           authMiddleware, runsController.get);
router.get('/tickets/inprogress', authMiddleware, ticketsController.inProgress);
router.get('/developers/idle',    authMiddleware, developersController.idle);

router.get('/config',  adminMiddleware, configController.getAll);
router.post('/config', adminMiddleware, configController.update);

module.exports = router;