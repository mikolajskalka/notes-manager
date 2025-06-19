const express = require('express');
const router = express.Router();
const { Label, Note } = require('../models');
const { isAuthenticated } = require('../config/passport');

// Get all labels
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const labels = await Label.findAll({
            where: { userId: req.user.id }, // Only show labels belonging to the current user
            order: [['name', 'ASC']]
        });
        res.render('labels/index', { labels });
    } catch (error) {
        console.error('Error fetching labels:', error);
        req.flash('error', 'An error occurred while fetching labels.');
        const basePath = req.app.get('basePath') || '';
        res.redirect(basePath + '/notes');
    }
});

// Render form to create a new label
router.get('/new', isAuthenticated, (req, res) => {
    res.render('labels/new');
});

// Create a new label
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { name, color } = req.body;

        if (!name || name.trim() === '') {
            req.flash('error', 'Label name cannot be empty.');
            const basePath = req.app.get('basePath') || '';
            return res.redirect(basePath + '/labels/new');
        }

        // Check if label already exists for this user
        const existingLabel = await Label.findOne({
            where: {
                name: name.trim(),
                userId: req.user.id
            }
        });

        if (existingLabel) {
            req.flash('error', 'A label with this name already exists.');
            const basePath = req.app.get('basePath') || '';
            return res.redirect(basePath + '/labels/new');
        }

        await Label.create({
            name: name.trim(),
            color: color || '#6c757d', // Use provided color or default
            userId: req.user.id // Associate with the current user
        });
        req.flash('success', 'Label created successfully.');
        const basePath = req.app.get('basePath') || '';
        res.redirect(basePath + '/labels');
    } catch (error) {
        console.error('Error creating label:', error);
        req.flash('error', 'An error occurred while creating the label.');
        const basePath = req.app.get('basePath') || '';
        res.redirect(basePath + '/labels/new');
    }
});

// Render form to edit a label
router.get('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const label = await Label.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id // Ensure user can only edit their own labels
            }
        });

        if (!label) {
            req.flash('error', 'Label not found.');
            const basePath = req.app.get('basePath') || '';
            return res.redirect(basePath + '/labels');
        }

        res.render('labels/edit', { label });
    } catch (error) {
        console.error('Error fetching label for edit:', error);
        req.flash('error', 'An error occurred while fetching the label.');
        const basePath = req.app.get('basePath') || '';
        res.redirect(basePath + '/labels');
    }
});

// Update a label
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const { name, color } = req.body;

        if (!name || name.trim() === '') {
            req.flash('error', 'Label name cannot be empty.');
            const basePath = req.app.get('basePath') || '';
            return res.redirect(`${basePath}/labels/${req.params.id}/edit`);
        }

        const label = await Label.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id // Ensure user can only update their own labels
            }
        });

        if (!label) {
            req.flash('error', 'Label not found.');
            const basePath = req.app.get('basePath') || '';
            return res.redirect(basePath + '/labels');
        }

        // Check if new name already exists for this user (excluding the current label)
        const existingLabel = await Label.findOne({
            where: {
                name: name.trim(),
                userId: req.user.id,
                id: { [require('sequelize').Op.ne]: req.params.id }
            }
        });

        if (existingLabel) {
            req.flash('error', 'A label with this name already exists.');
            const basePath = req.app.get('basePath') || '';
            return res.redirect(`${basePath}/labels/${req.params.id}/edit`);
        }

        await label.update({
            name: name.trim(),
            color: color || label.color // Update color only if new color is provided
        });
        req.flash('success', 'Label updated successfully.');
        const basePath = req.app.get('basePath') || '';
        res.redirect(basePath + '/labels');
    } catch (error) {
        console.error('Error updating label:', error);
        req.flash('error', 'An error occurred while updating the label.');
        const basePath = req.app.get('basePath') || '';
        res.redirect(`${basePath}/labels/${req.params.id}/edit`);
    }
});

// Delete a label
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const label = await Label.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id // Ensure user can only delete their own labels
            }
        });

        if (!label) {
            req.flash('error', 'Label not found.');
            const basePath = req.app.get('basePath') || '';
            return res.redirect(basePath + '/labels');
        }

        await label.destroy();
        req.flash('success', 'Label deleted successfully.');
        const basePath = req.app.get('basePath') || '';
        res.redirect(basePath + '/labels');
    } catch (error) {
        console.error('Error deleting label:', error);
        req.flash('error', 'An error occurred while deleting the label.');
        const basePath = req.app.get('basePath') || '';
        res.redirect(basePath + '/labels');
    }
});

// Get notes with a specific label
router.get('/:id/notes', isAuthenticated, async (req, res) => {
    try {
        const label = await Label.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id // Ensure user can only see their own labels
            },
            include: {
                model: Note,
                where: { userId: req.user.id }
            }
        });

        if (!label) {
            req.flash('error', 'Label not found.');
            const basePath = req.app.get('basePath') || '';
            return res.redirect(basePath + '/labels');
        }

        res.render('labels/notes', { label, notes: label.Notes });
    } catch (error) {
        console.error('Error fetching notes by label:', error);
        req.flash('error', 'An error occurred while fetching notes.');
        const basePath = req.app.get('basePath') || '';
        res.redirect(basePath + '/labels');
    }
});

module.exports = router;