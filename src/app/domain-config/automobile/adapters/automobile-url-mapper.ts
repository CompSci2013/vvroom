/**
 * Automobile Domain - URL Mapper
 *
 * Implements IFilterUrlMapper for converting filters to/from URL parameters.
 * Enables URL-first state management and shareable filter states.
 *
 * Domain: Automobile Discovery
 */

import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { IFilterUrlMapper } from '../../../framework/models/resource-management.interface';
import { AutoSearchFilters } from '../models/automobile.filters';

/**
 * Automobile filter URL mapper
 *
 * Bidirectional conversion between filter objects and URL query parameters.
 * URL parameter names MUST match backend API parameter names (camelCase).
 * See: frontend/src/domain-config/automobile/API-DOCUMENTATION.md
 *
 * URL Parameter Mapping (matches backend API):
 * - manufacturer = manufacturer
 * - model = model
 * - yearMin = yearMin
 * - yearMax = yearMax
 * - bodyClass = bodyClass
 * - instanceCountMin = instanceCountMin
 * - instanceCountMax = instanceCountMax
 * - search = search
 * - page = page
 * - size = size
 * - sortBy = sort (filter property)
 * - sortOrder = sortDirection (filter property)
 *
 * @example
 * ```typescript
 * const mapper = new AutomobileUrlMapper();
 *
 * // To URL
 * const filters = new AutoSearchFilters({
 *   manufacturer: 'Toyota',
 *   yearMin: 2020,
 *   page: 1
 * });
 * const params = mapper.toUrlParams(filters);
 * // { manufacturer: 'Toyota', yearMin: '2020', page: '1' }
 *
 * // From URL
 * const urlParams = { manufacturer: 'Toyota', yearMin: '2020', page: '1' };
 * const filters = mapper.fromUrlParams(urlParams);
 * // AutoSearchFilters { manufacturer: 'Toyota', yearMin: 2020, page: 1 }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AutomobileUrlMapper implements IFilterUrlMapper<AutoSearchFilters> {
  /**
   * URL parameter names (must match backend API parameter names)
   * See: frontend/src/domain-config/automobile/API-DOCUMENTATION.md
   */
  private readonly PARAM_NAMES = {
    manufacturer: 'manufacturer',
    model: 'model',
    yearMin: 'yearMin',
    yearMax: 'yearMax',
    bodyClass: 'bodyClass',
    instanceCountMin: 'instanceCountMin',
    instanceCountMax: 'instanceCountMax',
    search: 'search',
    modelCombos: 'modelCombos', // From picker
    page: 'page',
    size: 'size',
    sort: 'sortBy',
    sortDirection: 'sortOrder'
  };

  /**
   * Convert filters to URL query parameters
   *
   * Maps filter object fields to short URL parameter names.
   * Only includes non-null/undefined values.
   * Converts all values to strings for URL compatibility.
   *
   * @param filters - Filter object
   * @returns URL query parameters
   */
  toUrlParams(filters: AutoSearchFilters): Params {
    const params: Params = {};

    // Search filters
    if (filters.manufacturer !== undefined && filters.manufacturer !== null) {
      params[this.PARAM_NAMES.manufacturer] = filters.manufacturer;
    }

    if (filters.model !== undefined && filters.model !== null) {
      params[this.PARAM_NAMES.model] = filters.model;
    }

    if (filters.yearMin !== undefined && filters.yearMin !== null) {
      params[this.PARAM_NAMES.yearMin] = String(filters.yearMin);
    }

    if (filters.yearMax !== undefined && filters.yearMax !== null) {
      params[this.PARAM_NAMES.yearMax] = String(filters.yearMax);
    }

    if (filters.bodyClass !== undefined && filters.bodyClass !== null) {
      // Handle array values (multiselect) - join with comma
      if (Array.isArray(filters.bodyClass)) {
        if (filters.bodyClass.length > 0) {
          params[this.PARAM_NAMES.bodyClass] = filters.bodyClass.join(',');
        }
      } else {
        params[this.PARAM_NAMES.bodyClass] = filters.bodyClass;
      }
    }

    if (filters.instanceCountMin !== undefined && filters.instanceCountMin !== null) {
      params[this.PARAM_NAMES.instanceCountMin] = String(filters.instanceCountMin);
    }

    if (filters.instanceCountMax !== undefined && filters.instanceCountMax !== null) {
      params[this.PARAM_NAMES.instanceCountMax] = String(filters.instanceCountMax);
    }

    if (filters.search !== undefined && filters.search !== null) {
      params[this.PARAM_NAMES.search] = filters.search;
    }

    if (filters.modelCombos !== undefined && filters.modelCombos !== null) {
      params[this.PARAM_NAMES.modelCombos] = filters.modelCombos;
    }

    // Pagination
    if (filters.page !== undefined && filters.page !== null) {
      params[this.PARAM_NAMES.page] = String(filters.page);
    }

    if (filters.size !== undefined && filters.size !== null) {
      params[this.PARAM_NAMES.size] = String(filters.size);
    }

    // Sorting
    if (filters.sort !== undefined && filters.sort !== null) {
      params[this.PARAM_NAMES.sort] = filters.sort;
    }

    if (filters.sortDirection !== undefined && filters.sortDirection !== null) {
      params[this.PARAM_NAMES.sortDirection] = filters.sortDirection;
    }

    return params;
  }

  /**
   * Convert URL query parameters to filters
   *
   * Maps short URL parameter names back to filter object fields.
   * Performs type conversion (strings to numbers).
   * Returns filter object with only defined values.
   *
   * @param params - URL query parameters
   * @returns Filter object
   */
  fromUrlParams(params: Params): AutoSearchFilters {
    const filters = new AutoSearchFilters();

    // Search filters
    if (params[this.PARAM_NAMES.manufacturer]) {
      filters.manufacturer = String(params[this.PARAM_NAMES.manufacturer]);
    }

    if (params[this.PARAM_NAMES.model]) {
      filters.model = String(params[this.PARAM_NAMES.model]);
    }

    if (params[this.PARAM_NAMES.yearMin]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.yearMin]);
      if (value !== null) {
        filters.yearMin = value;
      }
    }

    if (params[this.PARAM_NAMES.yearMax]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.yearMax]);
      if (value !== null) {
        filters.yearMax = value;
      }
    }

    if (params[this.PARAM_NAMES.bodyClass]) {
      const bodyClassParam = String(params[this.PARAM_NAMES.bodyClass]);
      // Check if it contains comma (multiple values)
      if (bodyClassParam.includes(',')) {
        filters.bodyClass = bodyClassParam.split(',').map(v => v.trim());
      } else {
        // Single value - still return as array for consistency with multiselect
        filters.bodyClass = [bodyClassParam];
      }
    }

    if (params[this.PARAM_NAMES.instanceCountMin]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.instanceCountMin]);
      if (value !== null) {
        filters.instanceCountMin = value;
      }
    }

    if (params[this.PARAM_NAMES.instanceCountMax]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.instanceCountMax]);
      if (value !== null) {
        filters.instanceCountMax = value;
      }
    }

    if (params[this.PARAM_NAMES.search]) {
      filters.search = String(params[this.PARAM_NAMES.search]);
    }

    if (params[this.PARAM_NAMES.modelCombos]) {
      filters.modelCombos = String(params[this.PARAM_NAMES.modelCombos]);
    }

    // Pagination
    if (params[this.PARAM_NAMES.page]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.page]);
      if (value !== null) {
        filters.page = value;
      }
    }

    if (params[this.PARAM_NAMES.size]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.size]);
      if (value !== null) {
        filters.size = value;
      }
    }

    // Sorting
    if (params[this.PARAM_NAMES.sort]) {
      filters.sort = String(params[this.PARAM_NAMES.sort]);
    }

    if (params[this.PARAM_NAMES.sortDirection]) {
      const direction = String(params[this.PARAM_NAMES.sortDirection]);
      if (direction === 'asc' || direction === 'desc') {
        filters.sortDirection = direction;
      }
    }

    return filters;
  }

  /**
   * Parse number from URL parameter value
   *
   * Safely converts string to number, returning null if invalid.
   *
   * @param value - URL parameter value
   * @returns Parsed number or null
   */
  private parseNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  /**
   * Get parameter name mapping
   *
   * Useful for debugging and documentation.
   *
   * @returns Parameter name mapping object
   */
  getParameterMapping(): Record<string, string> {
    return { ...this.PARAM_NAMES };
  }

  /**
   * Get URL parameter name for filter field
   *
   * @param filterField - Filter field name
   * @returns URL parameter name
   */
  getUrlParamName(filterField: keyof AutoSearchFilters): string | undefined {
    return this.PARAM_NAMES[filterField as keyof typeof this.PARAM_NAMES];
  }

  /**
   * Build shareable URL from filters
   *
   * Helper method to generate a complete URL with filter parameters.
   * Useful for creating shareable links.
   *
   * @param baseUrl - Base URL (e.g., '/discover')
   * @param filters - Filter object
   * @returns Complete URL with query parameters
   */
  buildShareableUrl(baseUrl: string, filters: AutoSearchFilters): string {
    const params = this.toUrlParams(filters);
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Check if URL parameters are valid
   *
   * Validates that URL parameters can be converted to filters.
   * Useful for handling invalid or corrupted URLs.
   *
   * @param params - URL query parameters
   * @returns Validation result with errors
   */
  validateUrlParams(params: Params): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check numeric fields
    const numericFields = [
      this.PARAM_NAMES.yearMin,
      this.PARAM_NAMES.yearMax,
      this.PARAM_NAMES.instanceCountMin,
      this.PARAM_NAMES.instanceCountMax,
      this.PARAM_NAMES.page,
      this.PARAM_NAMES.size
    ];

    numericFields.forEach((field) => {
      if (params[field] !== undefined && params[field] !== null) {
        const value = this.parseNumber(params[field]);
        if (value === null) {
          errors.push(`Invalid numeric value for ${field}: ${params[field]}`);
        }
      }
    });

    // Check sort direction
    if (params[this.PARAM_NAMES.sortDirection]) {
      const direction = String(params[this.PARAM_NAMES.sortDirection]);
      if (direction !== 'asc' && direction !== 'desc') {
        errors.push(
          `Invalid sort direction: ${direction}. Must be 'asc' or 'desc'.`
        );
      }
    }

    // Check year ranges
    if (params[this.PARAM_NAMES.yearMin] && params[this.PARAM_NAMES.yearMax]) {
      const min = this.parseNumber(params[this.PARAM_NAMES.yearMin]);
      const max = this.parseNumber(params[this.PARAM_NAMES.yearMax]);
      if (min !== null && max !== null && min > max) {
        errors.push(`Year minimum (${min}) cannot be greater than maximum (${max})`);
      }
    }

    // Check instance count ranges
    if (
      params[this.PARAM_NAMES.instanceCountMin] &&
      params[this.PARAM_NAMES.instanceCountMax]
    ) {
      const min = this.parseNumber(params[this.PARAM_NAMES.instanceCountMin]);
      const max = this.parseNumber(params[this.PARAM_NAMES.instanceCountMax]);
      if (min !== null && max !== null && min > max) {
        errors.push(
          `Instance count minimum (${min}) cannot be greater than maximum (${max})`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Extract highlight filters from URL parameters
   *
   * Automobile-specific strategy: Look for 'h_' prefix.
   * This enables segmented statistics highlighting (e.g., h_manufacturer=Ford
   * highlights Ford in charts while showing all data).
   *
   * Normalizes separators: Converts pipes (|) to commas (,) for backend compatibility.
   * Backend expects comma-separated values: h_manufacturer=Ford,Buick
   *
   * @param params - URL query parameters
   * @returns Highlight filters object
   */
  extractHighlights(params: Params): Record<string, any> {
    const highlights: Record<string, any> = {};
    const prefix = 'h_';

    Object.keys(params).forEach(key => {
      if (key.startsWith(prefix)) {
        const highlightKey = key.substring(prefix.length);
        let value = params[key];

        // Normalize separators: Convert pipes to commas for backend compatibility
        // Supports both h_manufacturer=Ford,Buick and h_manufacturer=Ford|Buick
        if (typeof value === 'string' && value.includes('|')) {
          value = value.replace(/\|/g, ',');
        }

        highlights[highlightKey] = value;
      }
    });

    return highlights;
  }

  /**
   * Sanitize URL parameters
   *
   * Removes invalid parameters and corrects invalid values.
   * Returns cleaned parameter object.
   *
   * @param params - URL query parameters
   * @returns Sanitized parameters
   */
  sanitizeUrlParams(params: Params): Params {
    const sanitized: Params = {};
    const validParams = Object.values(this.PARAM_NAMES);

    // Only keep valid parameter names
    Object.keys(params).forEach((key) => {
      if (validParams.includes(key)) {
        sanitized[key] = params[key];
      }
    });

    // Fix numeric values
    const numericFields = [
      this.PARAM_NAMES.yearMin,
      this.PARAM_NAMES.yearMax,
      this.PARAM_NAMES.instanceCountMin,
      this.PARAM_NAMES.instanceCountMax,
      this.PARAM_NAMES.page,
      this.PARAM_NAMES.size
    ];

    numericFields.forEach((field) => {
      if (sanitized[field]) {
        const value = this.parseNumber(sanitized[field]);
        if (value === null) {
          delete sanitized[field]; // Remove invalid numeric values
        }
      }
    });

    // Fix sort direction
    if (sanitized[this.PARAM_NAMES.sortDirection]) {
      const direction = String(sanitized[this.PARAM_NAMES.sortDirection]);
      if (direction !== 'asc' && direction !== 'desc') {
        delete sanitized[this.PARAM_NAMES.sortDirection];
      }
    }

    return sanitized;
  }
}
