const database = require('../config/database');

class Generation {
  constructor(data) {
    this.jobId = data.jobId;
    this.modelId = data.modelId;
    this.pose = data.pose || 'professional_standing';
    this.provider = data.provider;
    this.status = data.status || 'processing';
    this.progress = data.progress || 0;
    this.userIp = data.userIp;
    this.userAgent = data.userAgent;
  }

  async save() {
    try {
      const pool = database.getPool();

      if (this.id) {
        // Update existing record
        const [result] = await pool.execute(`
          UPDATE generations
          SET modelId = ?, pose = ?, provider = ?, status = ?, progress = ?,
              userIp = ?, userAgent = ?
          WHERE id = ?
        `, [
          this.modelId, this.pose, this.provider, this.status, this.progress,
          this.userIp, this.userAgent, this.id
        ]);
        return result;
      } else {
        // Insert new record
        const [result] = await pool.execute(`
          INSERT INTO generations
          (jobId, modelId, pose, provider, status, progress, userIp, userAgent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          this.jobId, this.modelId, this.pose, this.provider,
          this.status, this.progress, this.userIp, this.userAgent
        ]);

        this.id = result.insertId;
        this.createdAt = new Date();
        return result;
      }
    } catch (error) {
      console.error('❌ Generation save failed:', error);
      throw error;
    }
  }

  async updateProgress(progress, status = null) {
    try {
      const pool = database.getPool();
      this.progress = Math.min(100, Math.max(0, progress));

      let query = 'UPDATE generations SET progress = ?';
      let params = [this.progress];

      if (status) {
        query += ', status = ?';
        params.push(status);
        this.status = status;
      }

      query += ' WHERE jobId = ?';
      params.push(this.jobId);

      const [result] = await pool.execute(query, params);
      return result;
    } catch (error) {
      console.error('❌ Progress update failed:', error);
      throw error;
    }
  }

  async complete(result) {
    try {
      const pool = database.getPool();

      const [updateResult] = await pool.execute(`
        UPDATE generations
        SET status = 'completed', progress = 100, endTime = NOW(),
            processingTime = TIMESTAMPDIFF(MICROSECOND, createdAt, NOW()) / 1000,
            imageUrl = ?, imagePath = ?, prompt = ?, metadata = ?
        WHERE jobId = ?
      `, [
        result.imageUrl, result.imagePath, result.prompt,
        JSON.stringify(result.metadata), this.jobId
      ]);

      this.status = 'completed';
      this.progress = 100;
      this.endTime = new Date();

      if (result) {
        this.imageUrl = result.imageUrl;
        this.imagePath = result.imagePath;
        this.prompt = result.prompt;
        this.metadata = result.metadata;
      }

      return updateResult;
    } catch (error) {
      console.error('❌ Generation completion failed:', error);
      throw error;
    }
  }

  async fail(errorMessage) {
    try {
      const pool = database.getPool();

      const [result] = await pool.execute(`
        UPDATE generations
        SET status = 'failed', error = ?, endTime = NOW(),
            processingTime = TIMESTAMPDIFF(MICROSECOND, createdAt, NOW()) / 1000
        WHERE jobId = ?
      `, [errorMessage, this.jobId]);

      this.status = 'failed';
      this.error = errorMessage;
      this.endTime = new Date();

      return result;
    } catch (error) {
      console.error('❌ Generation fail operation failed:', error);
      throw error;
    }
  }

  static async findByJobId(jobId) {
    try {
      const pool = database.getPool();
      const [rows] = await pool.execute(
        'SELECT * FROM generations WHERE jobId = ?',
        [jobId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('❌ findByJobId failed:', error);
      throw error;
    }
  }

  static async findByStatus(status, limit = 20) {
    try {
      const pool = database.getPool();
      const [rows] = await pool.execute(
        'SELECT * FROM generations WHERE status = ? ORDER BY createdAt DESC LIMIT ?',
        [status, limit]
      );
      return rows;
    } catch (error) {
      console.error('❌ findByStatus failed:', error);
      throw error;
    }
  }

  static async findByModelId(modelId, limit = 10) {
    try {
      const pool = database.getPool();
      const [rows] = await pool.execute(
        'SELECT * FROM generations WHERE modelId = ? ORDER BY createdAt DESC LIMIT ?',
        [modelId, limit]
      );
      return rows;
    } catch (error) {
      console.error('❌ findByModelId failed:', error);
      throw error;
    }
  }

  static async findHistory(options = {}) {
    try {
      const pool = database.getPool();
      const { modelId, limit = 20, page = 1 } = options;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = 'SELECT * FROM generations WHERE 1=1';
      let params = [];

      if (modelId) {
        query += ' AND modelId = ?';
        params.push(modelId);
      }

      query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const [rows] = await pool.execute(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM generations WHERE 1=1';
      let countParams = [];

      if (modelId) {
        countQuery += ' AND modelId = ?';
        countParams.push(modelId);
      }

      const [countRows] = await pool.execute(countQuery, countParams);
      const total = countRows[0].total;

      return {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      };
    } catch (error) {
      console.error('❌ findHistory failed:', error);
      throw error;
    }
  }
}

module.exports = Generation;