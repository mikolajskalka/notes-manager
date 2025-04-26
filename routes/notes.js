const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../models');
const { Note, Label, NoteLabel } = db;
const { isAuthenticated } = require('../config/passport');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // Limit file size to 10MB
    fileFilter: (req, file, cb) => {
        // Accept all files for simplicity, but you can add filters here
        cb(null, true);
    }
});

// Get all unique labels
const getUniqueLabels = async (userId) => {
    try {
        // Use a more direct approach to get unique labels associated with a user's notes
        const labels = await Label.findAll({
            include: [{
                model: Note,
                where: { userId },
                attributes: [], // Don't need to return note attributes
                through: { attributes: [] } // Don't need join table attributes
            }],
            order: [['name', 'ASC']]
        });

        return labels;
    } catch (err) {
        console.error('Error getting labels:', err);
        return [];
    }
};

// Search notes
router.get('/search', isAuthenticated, async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim() === '') {
            return res.redirect('/notes');
        }

        const searchQuery = query.trim();

        // Search in both title and content using Sequelize's Op.or and Op.like
        const { Op } = require('sequelize');
        const notes = await Note.findAll({
            where: {
                [Op.and]: [
                    { userId: req.user.id }, // Only search user's own notes
                    {
                        [Op.or]: [
                            { title: { [Op.like]: `%${searchQuery}%` } },
                            { content: { [Op.like]: `%${searchQuery}%` } }
                        ]
                    }
                ]
            },
            order: [['updatedAt', 'DESC']]
        });

        // Get all available labels for filter bar
        const availableLabels = await getUniqueLabels(req.user.id);

        res.render('notes/index', { notes, searchQuery, availableLabels });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Filter notes by label
router.get('/label/:labelId', isAuthenticated, async (req, res) => {
    try {
        const labelId = req.params.labelId;

        // Get the label with associated notes for this user
        const label = await Label.findByPk(labelId, {
            include: [{
                model: Note,
                where: { userId: req.user.id },
                required: true
            }]
        });

        if (!label) {
            req.flash('error', 'Label not found');
            return res.redirect('/notes');
        }

        // Get all available labels for filter bar
        const availableLabels = await getUniqueLabels(req.user.id);

        res.render('notes/index', {
            notes: label.Notes,
            selectedLabel: label,
            availableLabels
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Server error');
        res.redirect('/notes');
    }
});

// Get all notes
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const notes = await Note.findAll({
            where: { userId: req.user.id }, // Only return notes of the current user
            include: [Label], // Include labels
            order: [['updatedAt', 'DESC']]
        });

        // Get all available labels for filter bar
        const availableLabels = await getUniqueLabels(req.user.id);

        res.render('notes/index', { notes, availableLabels });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Server error');
        res.redirect('/');
    }
});

// Form to create a new note
router.get('/new', isAuthenticated, async (req, res) => {
    try {
        // Get all available labels
        const labels = await Label.findAll({
            order: [['name', 'ASC']]
        });
        res.render('notes/new', { labels });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Server error');
        res.redirect('/notes');
    }
});

// Create a new note
router.post('/', isAuthenticated, upload.single('attachment'), async (req, res) => {
    try {
        const { title, content, labelIds } = req.body;

        // Create the note without labels first
        const note = await Note.create({
            title,
            content,
            attachment: req.file ? `/uploads/${req.file.filename}` : null,
            userId: req.user.id
        });

        // If labelIds is provided, associate the labels with the note
        if (labelIds) {
            // Handle both single label and multiple labels
            const labelIdsArray = Array.isArray(labelIds) ? labelIds : [labelIds];

            // Create associations in the join table
            const labelAssociations = labelIdsArray.map(labelId => ({
                noteId: note.id,
                labelId: parseInt(labelId)
            }));

            if (labelAssociations.length > 0) {
                await NoteLabel.bulkCreate(labelAssociations);
            }
        }

        req.flash('success', 'Note created successfully');
        res.redirect('/notes');
    } catch (err) {
        console.error('Error creating note:', err);
        req.flash('error', 'An error occurred while creating the note');
        res.redirect('/notes/new');
    }
});

// Get a single note
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const note = await Note.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id // Ensure user can only view their own notes
            },
            include: [Label] // Include associated labels
        });

        if (!note) {
            req.flash('error', 'Note not found');
            return res.redirect('/notes');
        }

        res.render('notes/show', { note });
    } catch (err) {
        console.error('Error fetching note:', err);
        req.flash('error', 'Server error');
        res.redirect('/notes');
    }
});

// Form to edit a note
router.get('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        // Get the note with its associated labels
        const note = await Note.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id // Ensure user can only edit their own notes
            },
            include: [Label]
        });

        if (!note) {
            req.flash('error', 'Note not found');
            return res.redirect('/notes');
        }

        // Get all available labels
        const allLabels = await Label.findAll({
            order: [['name', 'ASC']]
        });

        res.render('notes/edit', { note, allLabels });
    } catch (err) {
        console.error('Error fetching note for edit:', err);
        req.flash('error', 'Server error');
        res.redirect('/notes');
    }
});

// Update a note
router.put('/:id', isAuthenticated, upload.single('attachment'), async (req, res) => {
    try {
        const note = await Note.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id // Ensure user can only update their own notes
            }
        });

        if (!note) {
            req.flash('error', 'Note not found');
            return res.redirect('/notes');
        }

        const { title, content, labelIds } = req.body;

        // Update the note's basic information
        const updateData = {
            title,
            content
        };

        // If there's a new file, update attachment and delete old file if exists
        if (req.file) {
            if (note.attachment) {
                const oldFilePath = path.join(__dirname, '..', 'public', note.attachment);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
            updateData.attachment = `/uploads/${req.file.filename}`;
        }

        // Update the note
        await note.update(updateData);

        // Update the label associations
        // First, remove all existing associations
        await NoteLabel.destroy({
            where: { noteId: note.id }
        });

        // Then, add the new ones
        if (labelIds) {
            // Handle both single label and multiple labels
            const labelIdsArray = Array.isArray(labelIds) ? labelIds : [labelIds];

            // Create associations in the join table
            const labelAssociations = labelIdsArray.map(labelId => ({
                noteId: note.id,
                labelId: parseInt(labelId)
            }));

            if (labelAssociations.length > 0) {
                await NoteLabel.bulkCreate(labelAssociations);
            }
        }

        req.flash('success', 'Note updated successfully');
        res.redirect(`/notes/${note.id}`);
    } catch (err) {
        console.error('Error updating note:', err);
        req.flash('error', 'An error occurred while updating the note');
        res.redirect(`/notes/${req.params.id}/edit`);
    }
});

// Delete a note
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const note = await Note.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id // Ensure user can only delete their own notes
            }
        });

        if (!note) {
            return res.status(404).send('Notatka nie została znaleziona');
        }

        // Delete attachment file if exists
        if (note.attachment) {
            const filePath = path.join(__dirname, '..', 'public', note.attachment);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await note.destroy();
        res.redirect('/notes');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Export note
router.get('/:id/export', isAuthenticated, async (req, res) => {
    try {
        const note = await Note.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id // Ensure user can only export their own notes
            },
            include: [Label] // Include labels
        });

        if (!note) {
            req.flash('error', 'Note not found');
            return res.redirect('/notes');
        }

        // Create a sanitized file name from the note title
        const sanitizedTitle = note.title
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '_');    // Replace spaces with underscores

        // Create a text file with note content
        const fileName = `${sanitizedTitle}_${note.id}.txt`;
        const filePath = path.join(__dirname, '..', 'public', 'uploads', fileName);

        // Format labels for export
        const labelNames = note.Labels.map(label => label.name);
        const labelsText = labelNames.length > 0
            ? `Labels: ${labelNames.join(', ')}\n\n`
            : '';

        // Write content to file
        const content = `Title: ${note.title}\n\nCreated: ${note.createdAt}\nUpdated: ${note.updatedAt}\n\n${labelsText}${note.content}`;
        fs.writeFileSync(filePath, content);

        // Send file as download
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                req.flash('error', 'Error exporting note');
                return res.redirect(`/notes/${note.id}`);
            }

            // Delete file after download asynchronously
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Error deleting exported file:', unlinkErr);
                }
            });
        });
    } catch (err) {
        console.error('Error exporting note:', err);
        req.flash('error', 'Server error');
        res.redirect('/notes');
    }
});

module.exports = router;