/**
 * Migration Manager for Notes Manager Application
 * Handles database schema migrations and versioning
 */

const path = require('path');
const fs = require('fs');

/**
 * MigrationManager class to handle database schema migrations
 */
class MigrationManager {
    constructor(sequelize, models) {
        this.sequelize = sequelize;
        this.models = models;
        this.migrations = [];
    }

    /**
     * Initialize the MigrationManager
     * Creates the MigrationMeta table if it doesn't exist
     */
    async init() {
        try {
            // Define migration meta table to track applied migrations
            this.MigrationMeta = this.sequelize.define('MigrationMeta', {
                id: {
                    type: this.sequelize.Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                name: {
                    type: this.sequelize.Sequelize.STRING,
                    allowNull: false,
                    unique: true
                },
                appliedAt: {
                    type: this.sequelize.Sequelize.DATE,
                    defaultValue: this.sequelize.Sequelize.NOW
                }
            }, {
                timestamps: false,
                tableName: 'MigrationMeta'
            });

            // Sync only the MigrationMeta table
            await this.MigrationMeta.sync();

            return true;
        } catch (error) {
            console.error('Failed to initialize MigrationManager:', error);
            return false;
        }
    }

    /**
     * Register a migration to be applied
     * @param {string} name - Migration name
     * @param {Function} up - Function to apply migration
     */
    registerMigration(name, up) {
        this.migrations.push({ name, up });
    }

    /**
     * Load migrations from directory
     * @param {string} directory - Directory path containing migration files
     */
    async loadMigrationsFromDirectory(directory) {
        try {
            // Read migration files from directory
            const files = fs.readdirSync(directory)
                .filter(file => file.endsWith('.js'))
                .sort(); // Sort to ensure migrations are applied in order

            for (const file of files) {
                const migration = require(path.join(directory, file));
                const name = path.basename(file, '.js');

                if (typeof migration.up === 'function') {
                    this.registerMigration(name, migration.up);
                } else {
                    console.warn(`Migration ${name} does not export an 'up' function`);
                }
            }

            return files.length;
        } catch (error) {
            console.error('Failed to load migrations:', error);
            return 0;
        }
    }

    /**
     * Check if a migration has been applied
     * @param {string} name - Migration name
     * @returns {Promise<boolean>} - Whether migration has been applied
     */
    async isMigrationApplied(name) {
        try {
            const applied = await this.MigrationMeta.findOne({
                where: { name }
            });

            return !!applied;
        } catch (error) {
            console.error(`Failed to check if migration ${name} was applied:`, error);
            return false;
        }
    }

    /**
     * Mark a migration as applied
     * @param {string} name - Migration name
     */
    async markMigrationApplied(name) {
        try {
            await this.MigrationMeta.create({ name });
            return true;
        } catch (error) {
            console.error(`Failed to mark migration ${name} as applied:`, error);
            return false;
        }
    }

    /**
     * Run all pending migrations
     */
    async runMigrations() {
        console.log(`Checking for ${this.migrations.length} pending migrations...`);

        let appliedCount = 0;

        for (const migration of this.migrations) {
            const { name, up } = migration;

            // Skip if migration already applied
            if (await this.isMigrationApplied(name)) {
                console.log(`Migration ${name} already applied`);
                continue;
            }

            try {
                console.log(`Applying migration: ${name}`);

                // Begin transaction
                const transaction = await this.sequelize.transaction();

                try {
                    // Run migration function with transaction
                    await up(this.sequelize, this.sequelize.Sequelize, transaction);

                    // Mark migration as applied
                    await this.markMigrationApplied(name);

                    // Commit transaction
                    await transaction.commit();

                    console.log(`Migration ${name} applied successfully`);
                    appliedCount++;
                } catch (error) {
                    // Rollback transaction on error
                    await transaction.rollback();
                    throw error;
                }
            } catch (error) {
                console.error(`Failed to apply migration ${name}:`, error);
                // Stop applying migrations after error
                return false;
            }
        }

        if (appliedCount > 0) {
            console.log(`Applied ${appliedCount} migrations successfully`);
        } else {
            console.log('No new migrations to apply');
        }

        return true;
    }

    /**
     * Check if the database schema is up to date with the models
     */
    async checkSchemaUpToDate() {
        try {
            // For SQLite, we check if all expected columns exist in tables
            // Get all tables
            const [tables] = await this.sequelize.query(`SELECT name FROM sqlite_master WHERE type='table'`);

            for (const modelName in this.models) {
                if (modelName === 'sequelize' || modelName === 'Sequelize') continue;

                const model = this.models[modelName];
                const tableName = model.tableName || model.name;

                // Skip MigrationMeta table
                if (tableName === 'MigrationMeta') continue;

                // Check if table exists
                if (!tables.some(t => t.name === tableName)) {
                    console.log(`Table ${tableName} does not exist`);
                    return false;
                }

                // Get columns for this table
                const [columns] = await this.sequelize.query(`PRAGMA table_info(${tableName})`);

                // Check if all model attributes exist as columns
                for (const attributeName in model.rawAttributes) {
                    const attribute = model.rawAttributes[attributeName];

                    // Skip virtual attributes
                    if (attribute.type.constructor.name === 'VIRTUAL') continue;

                    // Get field name (could be different from attribute name)
                    const fieldName = attribute.field || attributeName;

                    // Check if column exists
                    if (!columns.some(c => c.name === fieldName)) {
                        console.log(`Column ${fieldName} missing from table ${tableName}`);
                        return false;
                    }
                }
            }

            return true;
        } catch (error) {
            console.error('Failed to check schema:', error);
            return false;
        }
    }
}

module.exports = MigrationManager;