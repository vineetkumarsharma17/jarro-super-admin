import api from './api';

export const qrTemplateService = {
  /**
   * Get all custom QR templates saved in DB
   */
  async getCustomTemplates() {
    const res = await api.get('/super/qr-templates');
    return res.data;
  },

  /**
   * Upload and save a new custom QR template
   * @param {FormData|Object} data
   */
  async createCustomTemplate(data) {
    const config = data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const res = await api.post('/super/qr-templates', data, config);
    return res.data;
  },

  /**
   * Update coordinates or title for a saved QR template
   * @param {string} id
   * @param {Object} coords { title, size, x, y }
   */
  async updateCustomTemplateCoords(id, coords) {
    const res = await api.put(`/super/qr-templates/${id}`, coords);
    return res.data;
  },

  /**
   * Delete a custom QR template from DB
   * @param {string} id
   */
  async deleteCustomTemplate(id) {
    const res = await api.delete(`/super/qr-templates/${id}`);
    return res.data;
  },
};

export default qrTemplateService;
