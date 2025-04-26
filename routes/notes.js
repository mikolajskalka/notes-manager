const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../models');
const Note = db.Note;

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

// Search notes
router.get('/search', async (req, res) => {
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

        res.render('notes/index', { notes, searchQuery });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Get all notes
router.get('/', async (req, res) => {
    try {
        const notes = await Note.findAll({
            where: { userId: req.user.id }, // Only return notes of the current user
            order: [['updatedAt', 'DESC']]
        });
        res.render('notes/index', { notes });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Form to create a new note
router.get('/new', (req, res) => {
    res.render('notes/new');
});

// Create a new note
router.post('/', upload.single('attachment'), async (req, res) => {
    try {
        const { title, content } = req.body;
        const noteData = {
            title,
            content,
            attachment: req.file ? `/uploads/${req.file.filename}` : null,
            userId: req.user.id // Associate note with current user
        };

        await Note.create(noteData);
        res.redirect('/notes');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Get a single note
router.get('/:id', async (req, res) => {
    try {
        const note = await Note.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id // Ensure user can only view their own notes
            }
        });

        if (!note) {
            return res.status(404).send('Notatka nie została znaleziona');
        }

        res.render('notes/show', { note });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Form to edit a note
router.get('/:id/edit', async (req, res) => {
    try {
        const note = await Note.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id // Ensure user can only edit their own notes
            }
        });

        if (!note) {
            return res.status(404).send('Notatka nie została znaleziona');
        }

        res.render('notes/edit', { note });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Update a note
router.put('/:id', upload.single('attachment'), async (req, res) => {
    try {
        const note = await Note.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id // Ensure user can only update their own notes
            }
        });

        if (!note) {
            return res.status(404).send('Notatka nie została znaleziona');
        }

        const { title, content } = req.body;
        const updateData = { title, content };

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

        await note.update(updateData);
        res.redirect(`/notes/${note.id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Delete a note
router.delete('/:id', async (req, res) => {
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
router.get('/:id/export', async (req, res) => {
  try {
    const note = await Note.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id // Ensure user can only export their own notes
      }
    });
    
    if (!note) {
      return res.status(404).send('Notatka nie została znaleziona');
    }

    // Create a sanitized file name from the note title
    const sanitizedTitle = note.title
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '_');    // Replace spaces with underscores
    
    // Create a text file with note content
    const fileName = `${sanitizedTitle}_${note.id}.txt`;
    const filePath = path.join(__dirname, '..', 'public', 'uploads', fileName);

    // Write content to file
    const content = `Title: ${note.title}\n\nCreated: ${note.createdAt}\nUpdated: ${note.updatedAt}\n\n${note.content}`;
    fs.writeFileSync(filePath, content);

    // Send file as download
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      
      // Delete file after download asynchronously
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting exported file:', unlinkErr);
        } else {
          console.log(`Successfully deleted exported file: ${fileName}`);
        }
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;