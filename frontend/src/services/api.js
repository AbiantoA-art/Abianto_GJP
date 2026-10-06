/**
 * API Service for Government Job Portal
 * Centralized HTTP request handling with standard response formatting
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Health check endpoint service
 */
export const checkApiHealth = async () => {
  const startTime = performance.now();
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
      raw: data,
      latencyMs,
      statusCode: response.status,
    };
  } catch (error) {
    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);
    return {
      success: false,
      error: error.message || 'Unable to connect to Government Job Portal API',
      latencyMs,
      statusCode: null,
    };
  }
};

/**
 * Citizen / Candidate Registration API
 * POST /api/auth/register
 */
export const registerCandidate = async ({ fullName, email, dateOfBirth, date_of_birth, mobile, password, confirmPassword }) => {
  try {
    const payload = {
      full_name: fullName,
      email,
      date_of_birth: dateOfBirth || date_of_birth,
      password,
      confirm_password: confirmPassword,
    };
    if (mobile) {
      payload.mobile_number = mobile;
    }

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Registration failed.',
        errors: data.errors || null,
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message || 'Registration successful.',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error during registration.',
    };
  }
};

/**
 * Official & Candidate Login API
 * POST /api/auth/login
 */
export const loginUser = async ({ email, password }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Authentication failed.',
        errors: data.errors || null,
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message || 'Login successful.',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error during authentication.',
    };
  }
};

/**
 * Fetch Current Authenticated User Profile
 * GET /api/auth/me
 */
export const getCurrentUser = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Session verification failed.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data?.user || data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Failed to verify session.',
    };
  }
};

/**
 * Administrative Access Verification Test
 * GET /api/admin/test
 */
export const testAdminAccess = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/test`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Admin authorization failed.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error.',
    };
  }
};

/**
 * Fetch Official Job Categories
 * GET /api/categories
 */
export const getCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to load categories.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data || [],
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error loading categories.',
    };
  }
};

/**
 * Fetch Published Jobs for Public / Candidate Job Discovery
 * GET /api/jobs?page=1&limit=12&search=...&category_id=...
 */
export const getJobs = async ({
  page = 1,
  limit = 12,
  search = '',
  category_id = '',
  job_group = '',
  location = '',
  organization = '',
  department = '',
  opening_date_from = '',
  opening_date_to = '',
  last_date_from = '',
  last_date_to = '',
  sort = 'latest',
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search && String(search).trim()) params.append('search', String(search).trim());
    if (category_id) params.append('category_id', category_id);
    if (job_group && String(job_group).trim()) params.append('job_group', String(job_group).trim());
    if (location && String(location).trim()) params.append('location', String(location).trim());
    if (organization && String(organization).trim()) params.append('organization', String(organization).trim());
    if (department && String(department).trim()) params.append('department', String(department).trim());
    if (opening_date_from && String(opening_date_from).trim()) params.append('opening_date_from', String(opening_date_from).trim());
    if (opening_date_to && String(opening_date_to).trim()) params.append('opening_date_to', String(opening_date_to).trim());
    if (last_date_from && String(last_date_from).trim()) params.append('last_date_from', String(last_date_from).trim());
    if (last_date_to && String(last_date_to).trim()) params.append('last_date_to', String(last_date_to).trim());
    if (sort && String(sort).trim()) params.append('sort', String(sort).trim());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/jobs${queryString}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to retrieve jobs.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data || [],
      pagination: data.pagination || null,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error retrieving jobs.',
    };
  }
};

export const getPublishedJobs = getJobs;

/**
 * Fetch Single Published Job Details for Candidates
 * GET /api/jobs/:id
 */
export const getJob = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Job not found.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error loading job details.',
    };
  }
};

export const getPublishedJobById = getJob;
export const getJobById = getJob;

/**
 * Fetch Paginated Jobs for Admin Console
 * GET /api/admin/jobs?page=1&limit=10&status=...&search=...
 */
export const getAdminJobs = async ({ page = 1, limit = 10, status = '', search = '', category_id = '', job_group = '' } = {}, token) => {
  try {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (category_id) params.append('category_id', category_id);
    if (job_group && String(job_group).trim()) params.append('job_group', String(job_group).trim());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/admin/jobs${queryString}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to retrieve jobs.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data || [],
      pagination: data.pagination || null,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error retrieving jobs.',
    };
  }
};

/**
 * Fetch Aggregate Job Lifecycle Statistics for Admin Console
 * GET /api/admin/jobs/stats
 */
export const getAdminJobStats = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/jobs/stats`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to retrieve job statistics.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data || {},
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error retrieving job statistics.',
    };
  }
};

/**
 * Fetch Single Job Details for Admin Console
 * GET /api/admin/jobs/:id
 */
export const getAdminJob = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/jobs/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Job not found.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error loading job details.',
    };
  }
};

/**
 * Create New Government Vacancy Announcement
 * POST /api/admin/jobs
 */
export const createAdminJob = async (jobData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(jobData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to create job.',
        errors: data.errors || null,
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message || 'Job created successfully.',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error creating job.',
    };
  }
};

/**
 * Update Existing Government Vacancy Announcement
 * PUT /api/admin/jobs/:id
 */
export const updateAdminJob = async (id, jobData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/jobs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(jobData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to update job.',
        errors: data.errors || null,
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message || 'Job updated successfully.',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error updating job.',
    };
  }
};

/**
 * Update Only Job Lifecycle Status
 * PATCH /api/admin/jobs/:id/status
 */
export const updateAdminJobStatus = async (id, status, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/jobs/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to update job status.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message || 'Job status updated successfully.',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error updating job status.',
    };
  }
};

/**
 * Safely Archive Job (DELETE /api/admin/jobs/:id)
 * Non-destructively marks status = 'archived'
 */
export const archiveAdminJob = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/jobs/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to archive job.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message || 'Job archived successfully.',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error archiving job.',
    };
  }
};

/* ============================================================
 * PHASE 07 — CANDIDATE APPLICATION PROCESSING ENGINE APIS
 * ============================================================ */

/**
 * Submit a complete candidate job application (multipart/form-data)
 * POST /api/applications
 */
export const submitApplication = async (formData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to submit application.',
        errors: data.errors || null,
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message || 'Application submitted successfully.',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error during application submission.',
    };
  }
};

/**
 * Check if current candidate already applied for a specific job
 * GET /api/applications/check/:jobId
 */
export const checkAlreadyApplied = async (jobId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/check/${jobId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to check application status.',
        applied: false,
      };
    }

    return {
      success: true,
      statusCode: response.status,
      applied: data.data?.applied || false,
      applicationId: data.data?.application_id || null,
      id: data.data?.id || null,
      status: data.data?.status || null,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      applied: false,
      message: error.message || 'Network error checking application status.',
    };
  }
};

/**
 * Get current candidate's submitted applications
 * GET /api/applications
 */
export const getMyApplications = async ({ page = 1, limit = 20, status = '' } = {}, token) => {
  try {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (status) params.append('status', status);

    const response = await fetch(`${API_BASE_URL}/applications?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to load applications.',
        data: [],
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message,
      data: data.data || [],
      pagination: data.pagination || null,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error fetching applications.',
      data: [],
    };
  }
};

/**
 * Get candidate application details by ID
 * GET /api/applications/:id
 */
export const getCandidateApplicationById = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to retrieve application details.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error fetching application details.',
    };
  }
};

/**
 * Candidate withdraws application
 * PATCH /api/applications/:id/withdraw
 */
export const withdrawApplication = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/${id}/withdraw`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to withdraw application.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message || 'Application withdrawn successfully.',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error withdrawing application.',
    };
  }
};

/**
 * Helper to download document blob with authorization header
 */
export const downloadDocumentFile = async (docId, fileName, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/documents/${docId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download document (HTTP ${response.status})`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to download document file.',
    };
  }
};

/**
 * Admin: Get all applications with search and filters
 * GET /api/admin/applications
 */
export const getAdminApplications = async (
  { page = 1, limit = 10, search = '', status = '', job_id = null, candidate_id = null, date_from = '', date_to = '' } = {},
  token
) => {
  try {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (job_id) params.append('job_id', job_id);
    if (candidate_id) params.append('candidate_id', candidate_id);
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);

    const response = await fetch(`${API_BASE_URL}/admin/applications?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to retrieve applications.',
        data: [],
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data || [],
      pagination: data.pagination || null,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error fetching applications.',
      data: [],
    };
  }
};

/**
 * Admin: Get application statistics
 * GET /api/admin/applications/stats
 */
export const getAdminApplicationStats = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/applications/stats`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to retrieve application stats.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error fetching application statistics.',
    };
  }
};

/**
 * Admin: Get application details by ID
 * GET /api/admin/applications/:id
 */
export const getAdminApplicationById = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/applications/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to retrieve application details.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error fetching application details.',
    };
  }
};

/**
 * Admin: Update application status
 * PATCH /api/admin/applications/:id/status
 */
export const updateAdminApplicationStatus = async (id, status, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/applications/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to update application status.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message || 'Application status updated successfully.',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error updating application status.',
    };
  }
};

/**
 * =========================================================================
 * PHASE 08: STUDY MATERIALS & SYLLABUS APIS
 * =========================================================================
 */

/**
 * Public / Candidate: Get study materials & syllabus list with search, filter, sort & pagination
 * GET /api/materials
 */
export const getStudyMaterials = async (params = {}) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.material_type) query.append('material_type', params.material_type);
    if (params.subject) query.append('subject', params.subject);
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.exam_group) query.append('exam_group', params.exam_group);
    if (params.language) query.append('language', params.language);
    if (params.sort) query.append('sort', params.sort);

    const response = await fetch(`${API_BASE_URL}/materials?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to fetch study materials.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data || [],
      pagination: data.pagination || null,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error fetching study materials.',
    };
  }
};

/**
 * Public / Candidate: Get study material details by ID
 * GET /api/materials/:id
 */
export const getStudyMaterialById = async (id, token = null) => {
  try {
    const headers = {
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/materials/${id}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to fetch study material details.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error fetching material details.',
    };
  }
};

/**
 * Download Study Material File
 * GET /api/materials/:id/download
 */
export const downloadStudyMaterialFile = async (id, token = null, filename = 'document.pdf') => {
  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/materials/${id}/download`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to download study material.',
      };
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return {
      success: true,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error downloading study material.',
    };
  }
};

/**
 * Admin: Get study materials with all statuses, filters, and pagination
 * GET /api/admin/materials
 */
export const getAdminMaterials = async (params = {}, token) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.material_type) query.append('material_type', params.material_type);
    if (params.subject) query.append('subject', params.subject);
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.exam_group) query.append('exam_group', params.exam_group);
    if (params.language) query.append('language', params.language);
    if (params.status) query.append('status', params.status);
    if (params.sort) query.append('sort', params.sort);

    const response = await fetch(`${API_BASE_URL}/admin/materials?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to fetch admin materials.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data || [],
      pagination: data.pagination || null,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error fetching admin materials.',
    };
  }
};

/**
 * Admin: Get study materials statistics
 * GET /api/admin/materials/stats
 */
export const getAdminMaterialStats = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/materials/stats`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to fetch study material statistics.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error fetching material stats.',
    };
  }
};

/**
 * Admin: Get single material by ID
 * GET /api/admin/materials/:id
 */
export const getAdminMaterialById = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/materials/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to fetch material details.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error fetching material details.',
    };
  }
};

/**
 * Admin: Create / Upload new study material or syllabus
 * POST /api/admin/materials
 */
export const createAdminMaterial = async (formData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/materials`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to upload study material.',
        errors: data.errors || null,
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message || 'Study material uploaded successfully.',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error creating study material.',
    };
  }
};

/**
 * Admin: Update material metadata
 * PUT /api/admin/materials/:id
 */
export const updateAdminMaterial = async (id, materialData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/materials/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(materialData),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to update study material metadata.',
        errors: data.errors || null,
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message || 'Study material updated successfully.',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error updating study material.',
    };
  }
};

/**
 * Admin: Update material status (draft -> published -> archived)
 * PATCH /api/admin/materials/:id/status
 */
export const updateAdminMaterialStatus = async (id, status, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/materials/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to update material status.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message || 'Material status updated successfully.',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error updating material status.',
    };
  }
};

/**
 * Admin: Replace uploaded file
 * PATCH /api/admin/materials/:id/file
 */
export const replaceAdminMaterialFile = async (id, formData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/materials/${id}/file`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to replace material file.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message || 'File replaced successfully.',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error replacing material file.',
    };
  }
};

/**
 * Admin: Safe archive material (soft delete)
 * DELETE /api/admin/materials/:id
 */
export const archiveAdminMaterial = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/materials/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to archive material.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message || 'Material archived successfully.',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error archiving material.',
    };
  }
};

/* ==========================================================================
   PHASE 09 — IN-APP NOTIFICATIONS & ALERTS SYSTEM APIS
   ========================================================================== */

/**
 * Fetch paginated user notifications with filtering and search
 * GET /api/notifications
 */
export const getUserNotifications = async (params = {}, token) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.type) query.append('type', params.type);
    if (params.priority) query.append('priority', params.priority);
    if (params.is_read !== undefined && params.is_read !== '') query.append('is_read', params.is_read);
    if (params.status) query.append('status', params.status);
    if (params.sort) query.append('sort', params.sort);

    const url = `${API_BASE_URL}/notifications${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to fetch notifications.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message,
      data: data.data || [],
      pagination: data.pagination || null,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error fetching notifications.',
    };
  }
};

/**
 * Get active unread notifications count for badge
 * GET /api/notifications/unread-count
 */
export const getUnreadNotificationCount = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        unreadCount: 0,
        message: data.message || 'Failed to retrieve unread count.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      unreadCount: data.data?.unread_count || 0,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      unreadCount: 0,
      message: error.message || 'Network error retrieving unread count.',
    };
  }
};

/**
 * Get single notification details (with strict recipient verification)
 * GET /api/notifications/:id
 */
export const getNotificationById = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to fetch notification details.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error fetching notification details.',
    };
  }
};

/**
 * Mark a single notification as read
 * PATCH /api/notifications/:id/read
 */
export const markNotificationRead = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to mark notification as read.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error marking notification as read.',
    };
  }
};

/**
 * Mark all user notifications as read
 * PATCH /api/notifications/read-all
 */
export const markAllNotificationsRead = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to mark all notifications as read.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error marking all notifications as read.',
    };
  }
};

/**
 * Archive a user notification
 * PATCH /api/notifications/:id/archive
 */
export const archiveNotification = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/archive`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to archive notification.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error archiving notification.',
    };
  }
};

/**
 * Admin: List platform-wide notifications
 * GET /api/admin/notifications
 */
export const getAdminNotifications = async (params = {}, token) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.recipient_id) query.append('recipient_id', params.recipient_id);
    if (params.type) query.append('type', params.type);
    if (params.priority) query.append('priority', params.priority);
    if (params.status) query.append('status', params.status);
    if (params.sort) query.append('sort', params.sort);

    const url = `${API_BASE_URL}/admin/notifications${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to fetch admin notifications.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message,
      data: data.data || [],
      pagination: data.pagination || null,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error fetching admin notifications.',
    };
  }
};

/**
 * Admin: Aggregate notification statistics
 * GET /api/admin/notifications/stats
 */
export const getAdminNotificationStats = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/notifications/stats`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to retrieve notification statistics.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      data: data.data || {},
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error retrieving notification statistics.',
    };
  }
};

/**
 * Admin: Broadcast or target an announcement
 * POST /api/admin/notifications
 */
export const createAdminAnnouncement = async (announcementData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(announcementData),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to publish announcement.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message || 'Announcement published successfully.',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error publishing announcement.',
    };
  }
};

/**
 * Admin: Archive notification
 * PATCH /api/admin/notifications/:id/archive
 */
export const archiveAdminNotification = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/notifications/${id}/archive`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to archive notification.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message || 'Notification archived successfully.',
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error archiving notification.',
    };
  }
};

/**
 * Admin: Trigger deadline alert verification
 * POST /api/admin/notifications/trigger-deadlines
 */
export const triggerAdminDeadlineAlerts = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/notifications/trigger-deadlines`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        message: data.message || 'Failed to trigger deadline alerts.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message: data.message,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      message: error.message || 'Network error triggering deadline alerts.',
    };
  }
};




