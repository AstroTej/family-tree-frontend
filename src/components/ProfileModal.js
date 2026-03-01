import React, { useState } from 'react';
import axios from 'axios';
import './ProfileModal.css'; 

const ProfileModal = ({ person, onClose, refreshData, allMembers, userRole }) => {
  const isNewPerson = !person;
  const [isEditing, setIsEditing] = useState(isNewPerson);
  
  // Safely extract IDs if they are populated objects or just strings
  const extractId = (field) => field ? (field._id || field) : '';

  const [formData, setFormData] = useState({
    firstName: person?.firstName || '',
    lastName: person?.lastName || '',
    gender: person?.gender || '',
    dateOfBirth: person?.dateOfBirth ? person.dateOfBirth.split('T')[0] : '',
    dateOfDeath: person?.dateOfDeath ? person.dateOfDeath.split('T')[0] : '',
    location: person?.location || '',
    occupation: person?.occupation || '',
    bio: person?.bio || '',
    father: extractId(person?.father),
    mother: extractId(person?.mother),
    spouse: extractId(person?.spouse),
  });
  
  const [imageFile, setImageFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    
    // Append all text fields
    Object.keys(formData).forEach(key => {
      if (formData[key]) data.append(key, formData[key]);
    });

    if (imageFile) data.append('image', imageFile);

    try {
      if (isNewPerson) {
        await axios.post('http://localhost:5000/api/family', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.put(`http://localhost:5000/api/family/${person._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      refreshData(); 
      onClose();     
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Check console for details.");
    }
  };

  // Helper to render the dropdowns without cluttering the JSX
  const renderDropdown = (label, name, currentValue) => (
    <div className="form-group">
      <label>{label}:</label>
      <select name={name} value={currentValue} onChange={handleInputChange}>
        <option value="">-- None --</option>
        {allMembers
          .filter(m => m._id !== person?._id)
          .map(member => (
            <option key={member._id} value={member._id}>
              {member.firstName} {member.lastName}
            </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <h2>{isNewPerson ? 'Add Family Member' : 'Edit Profile'}</h2>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>First Name:</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Last Name:</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>Gender:</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange}>
                <option value="">-- Select --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {renderDropdown('Father', 'father', formData.father)}
            {renderDropdown('Mother', 'mother', formData.mother)}
            {renderDropdown('Spouse', 'spouse', formData.spouse)}

            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Date of Birth:</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Date of Death (if applicable):</label>
                <input type="date" name="dateOfDeath" value={formData.dateOfDeath} onChange={handleInputChange} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Location (City):</label>
                <input type="text" name="location" value={formData.location} onChange={handleInputChange} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Occupation:</label>
                <input type="text" name="occupation" value={formData.occupation} onChange={handleInputChange} />
              </div>
            </div>

            <div className="form-group">
              <label>Bio & Notes:</label>
              <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="3" />
            </div>

            <div className="form-group">
              <label>Profile Picture:</label>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn">Save Profile</button>
              {!isNewPerson && <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>}
            </div>
          </form>
        ) : (
          <div className="profile-view">
            <img 
              src={person.imageUrl ? `https://family-tree-api-crb8.onrender.com${person.imageUrl}` : '/default-avatar.png'}
              alt={`${person.firstName} ${person.lastName}`} 
              className="profile-image"
            />
            <h2>{person.firstName} {person.lastName}</h2>
            {person.gender && <p style={{ fontStyle: 'italic', margin: '0 0 10px 0', color: '#7f8c8d' }}>{person.gender}</p>}
            
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'left', marginBottom: '15px' }}>
              {person.father && <p><strong>Father:</strong> {person.father.firstName} {person.father.lastName}</p>}
              {person.mother && <p><strong>Mother:</strong> {person.mother.firstName} {person.mother.lastName}</p>}
              {person.spouse && <p><strong>Spouse:</strong> {person.spouse.firstName} {person.spouse.lastName}</p>}
              
              <hr style={{ border: '0', borderTop: '1px solid #ddd', margin: '10px 0' }}/>
              
              <p><strong>DOB:</strong> {person.dateOfBirth ? new Date(person.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
              {person.dateOfDeath && <p><strong>Passed Away:</strong> {new Date(person.dateOfDeath).toLocaleDateString()}</p>}
              {person.location && <p><strong>Location:</strong> {person.location}</p>}
              {person.occupation && <p><strong>Occupation:</strong> {person.occupation}</p>}
            </div>

            {person.bio && (
              <div style={{ textAlign: 'left' }}>
                <strong>Bio:</strong>
                <p style={{ whiteSpace: 'pre-wrap', marginTop: '5px' }}>{person.bio}</p>
              </div>
            )}
            
            {userRole === 'edit' && (
              <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;