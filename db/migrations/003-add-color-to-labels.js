/**
 * Migration: Add color field to Labels table
 */

module.exports = {
    up: async (sequelize, Sequelize, transaction) => {
        try {
            // Add color column to Labels table
            await sequelize.query(`
                ALTER TABLE Labels 
                ADD COLUMN color TEXT DEFAULT '#6c757d' NOT NULL
            `, { transaction });

            console.log('Added color column to Labels table');
            return true;
        } catch (error) {
            console.error('Migration error:', error);
            throw error;
        }
    }
};