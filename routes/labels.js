const express = require('express');
const router = express.Router();
const { Label, Note } = require('../models');
const { isAuthenticated } = require('../config/passport');
const { createUrl } = require('../utils/urlHelper');

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
        req.flash('error', 'Wystąpił błąd podczas pobierania etykiet.');
        res.redirect(createUrl('/notes'));
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
            req.flash('error', 'Nazwa etykiety nie może być pusta.');
            return res.redirect(createUrl('/labels/new'));
        }

        // Check if label already exists for this user
        const existingLabel = await Label.findOne({
            where: {
                name: name.trim(),
                userId: req.user.id
            }
        });

        if (existingLabel) {
            req.flash('error', 'Etykieta o tej nazwie już istnieje.');
            return res.redirect(createUrl('/labels/new'));
        }

        await Label.create({
            name: name.trim(),
            color: color || '#6c757d', // Use provided color or default
            userId: req.user.id // Associate with the current user
        });
        req.flash('success', 'Etykieta została utworzona pomyślnie.');
        res.redirect(createUrl('/labels'));
    } catch (error) {
        console.error('Error creating label:', error);
        req.flash('error', 'Wystąpił błąd podczas tworzenia etykiety.');
        res.redirect(createUrl('/labels/new'));
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
            req.flash('error', 'Etykieta nie została znaleziona.');
            return res.redirect(createUrl('/labels'));
        }

        res.render('labels/edit', { label });
    } catch (error) {
        console.error('Error fetching label for edit:', error);
        req.flash('error', 'Wystąpił błąd podczas pobierania etykiety.');
        res.redirect(createUrl('/labels'));
    }
});

// Update a label
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const { name, color } = req.body;

        if (!name || name.trim() === '') {
            req.flash('error', 'Nazwa etykiety nie może być pusta.');
            return res.redirect(createUrl(`/labels/${req.params.id}/edit`));
        }

        const label = await Label.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id // Ensure user can only update their own labels
            }
        });

        if (!label) {
            req.flash('error', 'Etykieta nie została znaleziona.');
            return res.redirect(createUrl('/labels'));
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
            req.flash('error', 'Etykieta o tej nazwie już istnieje.');
            return res.redirect(createUrl(`/labels/${req.params.id}/edit`));
        }

        await label.update({
            name: name.trim(),
            color: color || label.color // Update color only if new color is provided
        });
        req.flash('success', 'Etykieta została zaktualizowana pomyślnie.');
        res.redirect(createUrl('/labels'));
    } catch (error) {
        console.error('Error updating label:', error);
        req.flash('error', 'Wystąpił błąd podczas aktualizacji etykiety.');
        res.redirect(createUrl(`/labels/${req.params.id}/edit`));
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
            req.flash('error', 'Etykieta nie została znaleziona.');
            return res.redirect(createUrl('/labels'));
        }

        await label.destroy();
        req.flash('success', 'Etykieta została usunięta pomyślnie.');
        res.redirect(createUrl('/labels'));
    } catch (error) {
        console.error('Error deleting label:', error);
        req.flash('error', 'Wystąpił błąd podczas usuwania etykiety.');
        res.redirect(createUrl('/labels'));
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
            req.flash('error', 'Etykieta nie została znaleziona.');
            return res.redirect(createUrl('/labels'));
        }

        res.render('labels/notes', { label, notes: label.Notes });
    } catch (error) {
        console.error('Error fetching notes by label:', error);
        req.flash('error', 'Wystąpił błąd podczas pobierania notatek.');
        res.redirect(createUrl('/labels'));
    }
});

module.exports = router;