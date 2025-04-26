const express = require('express');
const router = express.Router();
const { Label, Note } = require('../models');
const { isAuthenticated } = require('../config/passport');

// Get all labels
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const labels = await Label.findAll({
            order: [['name', 'ASC']]
        });
        res.render('labels/index', { labels });
    } catch (error) {
        console.error('Error fetching labels:', error);
        req.flash('error', 'An error occurred while fetching labels.');
        res.redirect('/notes');
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
            return res.redirect('/labels/new');
        }

        // Check if label already exists
        const existingLabel = await Label.findOne({ where: { name: name.trim() } });
        if (existingLabel) {
            req.flash('error', 'A label with this name already exists.');
            return res.redirect('/labels/new');
        }

        await Label.create({
            name: name.trim(),
            color: color || '#6c757d' // Use provided color or default
        });
        req.flash('success', 'Label created successfully.');
        res.redirect('/labels');
    } catch (error) {
        console.error('Error creating label:', error);
        req.flash('error', 'An error occurred while creating the label.');
        res.redirect('/labels/new');
    }
});

// Render form to edit a label
router.get('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const label = await Label.findByPk(req.params.id);
        if (!label) {
            req.flash('error', 'Label not found.');
            return res.redirect('/labels');
        }

        res.render('labels/edit', { label });
    } catch (error) {
        console.error('Error fetching label for edit:', error);
        req.flash('error', 'An error occurred while fetching the label.');
        res.redirect('/labels');
    }
});

// Update a label
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const { name, color } = req.body;

        if (!name || name.trim() === '') {
            req.flash('error', 'Label name cannot be empty.');
            return res.redirect(`/labels/${req.params.id}/edit`);
        }

        const label = await Label.findByPk(req.params.id);
        if (!label) {
            req.flash('error', 'Label not found.');
            return res.redirect('/labels');
        }

        // Check if new name already exists (excluding the current label)
        const existingLabel = await Label.findOne({
            where: {
                name: name.trim(),
                id: { [require('sequelize').Op.ne]: req.params.id }
            }
        });

        if (existingLabel) {
            req.flash('error', 'A label with this name already exists.');
            return res.redirect(`/labels/${req.params.id}/edit`);
        }

        await label.update({
            name: name.trim(),
            color: color || '#6c757d' // Use provided color or default
        });
        req.flash('success', 'Label updated successfully.');
        res.redirect('/labels');
    } catch (error) {
        console.error('Error updating label:', error);
        req.flash('error', 'An error occurred while updating the label.');
        res.redirect(`/labels/${req.params.id}/edit`);
    }
});

// Delete a label
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const label = await Label.findByPk(req.params.id);
        if (!label) {
            req.flash('error', 'Label not found.');
            return res.redirect('/labels');
        }

        await label.destroy();
        req.flash('success', 'Label deleted successfully.');
        res.redirect('/labels');
    } catch (error) {
        console.error('Error deleting label:', error);
        req.flash('error', 'An error occurred while deleting the label.');
        res.redirect('/labels');
    }
});

// Get notes with a specific label
router.get('/:id/notes', isAuthenticated, async (req, res) => {
    try {
        const label = await Label.findByPk(req.params.id, {
            include: {
                model: Note,
                where: { userId: req.user.id }
            }
        });

        if (!label) {
            req.flash('error', 'Label not found.');
            return res.redirect('/labels');
        }

        res.render('labels/notes', { label, notes: label.Notes });
    } catch (error) {
        console.error('Error fetching notes by label:', error);
        req.flash('error', 'An error occurred while fetching notes.');
        res.redirect('/labels');
    }
});

module.exports = router;