const Doctor = require('../models/Doctor');
const { sendInternalServerError } = require('../utils/apiResponse');

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
};

const buildDoctorSearchFilter = (searchTerm) => {
  if (!searchTerm) {
    return {};
  }

  return {
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { department: { $regex: searchTerm, $options: 'i' } }
    ]
  };
};

exports.getDoctors = async (req, res) => {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = Math.min(50, parsePositiveInteger(req.query.limit, 10));
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const skip = (page - 1) * limit;
    const filter = buildDoctorSearchFilter(search);

    // Count total matches and fetch current page in parallel.
    const [totalItems, doctors] = await Promise.all([
      Doctor.countDocuments(filter),
      Doctor.find(filter).skip(skip).limit(limit)
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNextPage: page * limit < totalItems,
        hasPrevPage: page > 1
      },
      count: doctors.length,
      doctors
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return sendInternalServerError(res, 'Error fetching doctors');
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    return res.status(200).json({
      success: true,
      doctor
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return sendInternalServerError(res, 'Error fetching doctor');
  }
};
