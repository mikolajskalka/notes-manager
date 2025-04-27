/**
 * Migration: Add userId to Labels table and make labels private per user
 */

module.exports = {
    up: async (sequelize, Sequelize, transaction) => {
        try {
            console.log('Starting migration: Add userId to Labels table');

            // 1. Check if userId column already exists in Labels table
            const [columns] = await sequelize.query(`PRAGMA table_info(Labels)`, { transaction });
            const userIdColumnExists = columns.some(column => column.name === 'userId');

            // 2. If userId column doesn't exist, add it
            if (!userIdColumnExists) {
                console.log('Adding userId column to Labels table');
                await sequelize.query(
                    'ALTER TABLE Labels ADD COLUMN userId INTEGER;',
                    { transaction }
                );

                // Get the default user ID (take the lowest user ID from the database)
                const [defaultUser] = await sequelize.query(
                    'SELECT id FROM Users ORDER BY id LIMIT 1',
                    { transaction }
                );

                // If there's at least one user in the system
                if (defaultUser && defaultUser.length > 0) {
                    const defaultUserId = defaultUser[0].id;
                    console.log(`Setting default userId (${defaultUserId}) for all existing labels`);

                    // Set the default user ID for all existing labels
                    await sequelize.query(
                        'UPDATE Labels SET userId = ? WHERE userId IS NULL',
                        {
                            replacements: [defaultUserId],
                            transaction
                        }
                    );
                } else {
                    console.log('No users found in the database. Labels will remain without userId until fixed manually.');
                }

                // Make userId NOT NULL for future entries
                await sequelize.query(
                    'CREATE TABLE Labels_temp (' +
                    'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
                    'name TEXT NOT NULL, ' +
                    'color TEXT NOT NULL DEFAULT "#6c757d", ' +
                    'userId INTEGER NOT NULL, ' +
                    'createdAt DATETIME NOT NULL, ' +
                    'updatedAt DATETIME NOT NULL' +
                    ');',
                    { transaction }
                );

                // Copy data to new table
                await sequelize.query(
                    'INSERT INTO Labels_temp SELECT * FROM Labels;',
                    { transaction }
                );

                // Drop old table and rename new one
                await sequelize.query('DROP TABLE Labels;', { transaction });
                await sequelize.query('ALTER TABLE Labels_temp RENAME TO Labels;', { transaction });

                // 3. Create unique index for name+userId instead of just name
                await sequelize.query(
                    'CREATE UNIQUE INDEX IF NOT EXISTS labels_name_userid ON Labels (name, userId);',
                    { transaction }
                );

                // 4. Drop old unique index on name if it exists
                try {
                    await sequelize.query(
                        'DROP INDEX IF EXISTS labels_name_unique;',
                        { transaction }
                    );
                } catch (error) {
                    console.log('No unique index on name column to drop');
                }

                console.log('Migration completed successfully');
            } else {
                console.log('userId column already exists in Labels table. Skipping migration.');
            }

            return true;
        } catch (error) {
            console.error('Migration error:', error);
            throw error;
        }
    }
};