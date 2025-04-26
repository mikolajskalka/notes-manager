/**
 * Migration: Create Labels table and NoteLabels join table
 */

module.exports = {
    up: async (sequelize, Sequelize, transaction) => {
        try {
            // 1. Create Labels table
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS Labels (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, { transaction });
            console.log('Created Labels table');

            // 2. Create NoteLabels join table
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS NoteLabels (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    noteId INTEGER NOT NULL,
                    labelId INTEGER NOT NULL,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(noteId, labelId),
                    FOREIGN KEY (noteId) REFERENCES Notes(id) ON DELETE CASCADE,
                    FOREIGN KEY (labelId) REFERENCES Labels(id) ON DELETE CASCADE
                )
            `, { transaction });
            console.log('Created NoteLabels join table');

            // 3. Check if labels column exists in Notes table
            const [columns] = await sequelize.query(`PRAGMA table_info(Notes)`, { transaction });
            const labelsColumnExists = columns.some(column => column.name === 'labels');

            if (labelsColumnExists) {
                // 4. Migrate data from Notes.labels to the new structure only if the column exists
                // Get all notes that have labels
                const [notes] = await sequelize.query(`
                    SELECT id, labels FROM Notes WHERE labels IS NOT NULL AND labels != ''
                `, { transaction });

                // For each note, create labels and associations
                for (const note of notes) {
                    if (note.labels) {
                        const labelNames = note.labels.split(',').map(label => label.trim());

                        for (const labelName of labelNames) {
                            if (labelName) {
                                // Insert label if it doesn't exist
                                await sequelize.query(`
                                    INSERT OR IGNORE INTO Labels (name, createdAt, updatedAt)
                                    VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                                `, {
                                    replacements: [labelName],
                                    transaction
                                });

                                // Get the label id
                                const [labelResult] = await sequelize.query(`
                                    SELECT id FROM Labels WHERE name = ?
                                `, {
                                    replacements: [labelName],
                                    transaction
                                });

                                if (labelResult && labelResult.length > 0) {
                                    const labelId = labelResult[0].id;

                                    // Create the association in NoteLabels
                                    await sequelize.query(`
                                        INSERT OR IGNORE INTO NoteLabels (noteId, labelId, createdAt, updatedAt)
                                        VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                                    `, {
                                        replacements: [note.id, labelId],
                                        transaction
                                    });
                                }
                            }
                        }
                    }
                }
                console.log('Migrated existing labels data');
            } else {
                console.log('Labels column does not exist in Notes table. Skipping data migration.');

                // Add the labels column to Notes table if it doesn't exist
                await sequelize.query(
                    'ALTER TABLE Notes ADD COLUMN labels TEXT;',
                    { transaction }
                );
                console.log('Added labels column to Notes table');
            }

            return true;
        } catch (error) {
            console.error('Migration error:', error);
            throw error;
        }
    }
};