/**
 * Migration: Add labels column to Notes table
 */

module.exports = {
    up: async (sequelize, Sequelize, transaction) => {
        try {
            // Check if labels column already exists
            const [columns] = await sequelize.query(`PRAGMA table_info(Notes)`);
            const labelsColumnExists = columns.some(column => column.name === 'labels');

            // Add labels column if it doesn't exist
            if (!labelsColumnExists) {
                await sequelize.query(
                    'ALTER TABLE Notes ADD COLUMN labels TEXT;',
                    { transaction }
                );
                console.log('Added labels column to Notes table');
            } else {
                console.log('Labels column already exists in Notes table');
            }

            return true;
        } catch (error) {
            console.error('Migration error:', error);
            throw error;
        }
    }
};