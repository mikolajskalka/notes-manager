/**
 * Migration: Add color field to Labels table
 */

module.exports = {
    up: async (sequelize, Sequelize, transaction) => {
        try {
            // Check if the color column already exists
            const [results] = await sequelize.query(`PRAGMA table_info(Labels);`, { transaction });
            const hasColor = results.some(col => col.name === 'color');
            if (!hasColor) {
                // Add color column to Labels table
                await sequelize.query(`
                    ALTER TABLE Labels 
                    ADD COLUMN color TEXT DEFAULT '#6c757d' NOT NULL
                `, { transaction });
                console.log('Added color column to Labels table');
            } else {
                console.log('Color column already exists in Labels table, skipping migration.');
            }
            return true;
        } catch (error) {
            console.error('Migration error:', error);
            throw error;
        }
    }
};