import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Tree from 'react-d3-tree';
import ProfileModal from './components/ProfileModal';
import { buildTree } from './utils/buildTree';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(localStorage.getItem('familyTreeRole') || null);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authToken, setAuthToken] = useState(localStorage.getItem('familyTreeAuth') || '');

  const [familyData, setFamilyData] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [centerId, setCenterId] = useState(null); 
  const [viewMode, setViewMode] = useState('focus'); 

  useEffect(() => {
    if (authToken && userRole) {
      axios.defaults.headers.common['x-family-password'] = authToken;
      fetchFamily();
    }
  }, [centerId, viewMode, authToken]); 

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 1. Check which role this password belongs to
      const authRes = await axios.post('https://family-tree-api-crb8.onrender.com/api/auth', { password: passwordInput });
      const role = authRes.data.role;

      // 2. Save the credentials
      localStorage.setItem('familyTreeAuth', passwordInput);
      localStorage.setItem('familyTreeRole', role);
      setAuthToken(passwordInput);
      setUserRole(role);
      setIsAuthenticated(true);
      setAuthError('');
      
      // 3. Load the tree!
      axios.defaults.headers.common['x-family-password'] = passwordInput;
      fetchFamily();
    } catch (error) {
      setAuthError('Incorrect password.');
    }
  };

  const fetchFamily = async () => {
    try {
      const response = await axios.get('https://family-tree-api-crb8.onrender.com/api/family');
      setAllMembers(response.data);
      if (response.data.length > 0) {
        setFamilyData(buildTree(response.data, centerId, viewMode));
      } else {
        setFamilyData(null); 
      }
      setIsAuthenticated(true); 
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setIsAuthenticated(false); 
        localStorage.removeItem('familyTreeAuth');
        localStorage.removeItem('familyTreeRole');
      }
      console.error("Error fetching family data:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8f9fa', fontFamily: 'sans-serif' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', textAlign: 'center', width: '350px' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Family Tree Hub</h2>
          <p style={{ color: '#7f8c8d', marginBottom: '20px', fontSize: '0.9rem' }}>Enter the family password to access the private tree.</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="password" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Password"
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }}
              required
            />
            {authError && <div style={{ color: '#e74c3c', fontSize: '0.85rem' }}>{authError}</div>}
            <button type="submit" style={{ padding: '10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>
              Unlock Tree
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredMembers = allMembers.filter(person => 
    person.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openProfile = (id) => {
    const person = allMembers.find(p => p._id === id);
    if (person) setSelectedPerson(person);
  };

  const getCardStyle = (gender, isCenter) => {
    let borderColor = '#bdc3c7'; 
    let bgColor = '#ffffff';

    if (gender === 'Male') {
      borderColor = '#3498db'; bgColor = '#ebf5fb';     
    } else if (gender === 'Female') {
      borderColor = '#e74c3c'; bgColor = '#fdedec';     
    }

    return {
      position: 'relative', overflow: 'hidden',   
      background: bgColor, border: `2px solid ${borderColor}`,
      borderRadius: '8px', padding: '10px', width: '140px',
      textAlign: 'center',
      boxShadow: isCenter ? `0 0 12px ${borderColor}80` : '0 2px 5px rgba(0,0,0,0.1)'
    };
  };

  const DeceasedRibbon = () => (
    <div style={{
      position: 'absolute', top: 0, right: 0, width: 0, height: 0,
      borderTop: '25px solid #2c3e50', borderLeft: '25px solid transparent'
    }} title="Deceased" />
  );

  const renderCustomNode = ({ nodeDatum }) => {
    const { id, gender, isDeceased, spouseId, spouseName, spouseGender, spouseIsDeceased, age, spouseAge, isCenter, label, spouseLabel } = nodeDatum.attributes;

    const primaryStyle = getCardStyle(gender, isCenter);
    const spouseStyle = getCardStyle(spouseGender, isCenter);

    const containerWidth = spouseName ? 320 : 150;
    const containerX = -70; 

    return (
      <foreignObject width={containerWidth} height="200" x={containerX} y="-20">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', width: '100%', height: '100%', fontFamily: 'sans-serif' }}>
          
          <div style={primaryStyle}>
            {isDeceased && <DeceasedRibbon />}
            {label && <div style={{ fontSize: '0.65rem', color: '#7f8c8d', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '0.5px' }}>{label}</div>}
            
            <div onClick={() => openProfile(id)} style={{ fontWeight: 'bold', color: '#2c3e50', cursor: 'pointer', marginBottom: '5px', position: 'relative', zIndex: 2 }}>{nodeDatum.name}</div>
            
            {age !== '' && <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '8px' }}>{isDeceased ? `Age at passing: ${age}` : `Age: ${age}`}</div>}

            <button onClick={() => { setCenterId(id); setViewMode('focus'); }} style={{ background: 'rgba(255,255,255,0.7)', color: '#333', border: '1px solid #bdc3c7', padding: '5px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', width: '100%', fontWeight: 'bold', position: 'relative', zIndex: 2 }}>
              🧭 Focus
            </button>
          </div>

          {spouseName && (
            <>
              <div style={{ width: '20px', height: '3px', background: '#bdc3c7', marginTop: '35px' }}></div>
              <div style={spouseStyle}>
                {spouseIsDeceased && <DeceasedRibbon />}
                {spouseLabel && <div style={{ fontSize: '0.65rem', color: '#7f8c8d', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '0.5px' }}>{spouseLabel}</div>}

                <div onClick={() => openProfile(spouseId)} style={{ fontWeight: 'bold', color: '#2c3e50', cursor: 'pointer', marginBottom: '5px', position: 'relative', zIndex: 2 }}>{spouseName}</div>
                
                {spouseAge !== '' && <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '8px' }}>{spouseIsDeceased ? `Age at passing: ${spouseAge}` : `Age: ${spouseAge}`}</div>}

                <button onClick={() => { setCenterId(spouseId); setViewMode('focus'); }} style={{ background: 'rgba(255,255,255,0.7)', color: '#333', border: '1px solid #bdc3c7', padding: '5px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', width: '100%', fontWeight: 'bold', position: 'relative', zIndex: 2 }}>
                  🧭 Focus
                </button>
              </div>
            </>
          )}
        </div>
      </foreignObject>
    );
  };

  return (
    <div className="app-container">
      <header className="top-bar">
        <h1>Family Tree Hub</h1>
        
        <div style={{ display: 'flex', gap: '10px', background: '#ecf0f1', padding: '5px', borderRadius: '8px' }}>
          <button onClick={() => setViewMode('focus')} style={{ padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', background: viewMode === 'focus' ? '#3498db' : 'transparent', color: viewMode === 'focus' ? 'white' : '#7f8c8d' }}>Focus View</button>
          <button onClick={() => setViewMode('full')} style={{ padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', background: viewMode === 'full' ? '#3498db' : 'transparent', color: viewMode === 'full' ? 'white' : '#7f8c8d' }}>Full Tree View</button>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input type="text" placeholder="Search relatives..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-filter" />
          
          {/* SECURE: Only render the Add button if they are an admin */}
          {userRole === 'edit' && (
            <button onClick={() => setSelectedPerson('NEW')} style={{ padding: '0.6rem 1.2rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Member</button>
          )}

          {/* Optional: Add a subtle logout button to let you switch accounts to test it */}
          <button 
            onClick={() => { setIsAuthenticated(false); localStorage.clear(); window.location.reload(); }} 
            style={{ padding: '0.6rem', background: 'transparent', color: '#7f8c8d', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Logout
          </button>
        </div>
      </header>

      {searchQuery ? (
        <div className="search-results">
          {filteredMembers.map(member => (
            <div key={member._id} onClick={() => { setCenterId(member._id); setViewMode('focus'); setSearchQuery(''); }}>
              {member.firstName} {member.lastName}
            </div>
          ))}
          {filteredMembers.length === 0 && <div style={{padding: '1rem'}}>No relatives found.</div>}
        </div>
      ) : (
        <div id="treeWrapper" style={{ width: '100vw', height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {familyData ? (
            <Tree data={familyData} renderCustomNodeElement={renderCustomNode} orientation="vertical" pathFunc="step" translate={{ x: window.innerWidth / 2, y: 150 }} nodeSize={{ x: 350, y: 220 }} />
          ) : (
            <div style={{ textAlign: 'center', color: '#7f8c8d' }}>
              <h2>Your family tree is empty!</h2>
            </div>
          )}
        </div>
      )}

      {selectedPerson && (
        <ProfileModal 
          person={selectedPerson === 'NEW' ? null : selectedPerson} 
          allMembers={allMembers}
          onClose={() => setSelectedPerson(null)} 
          refreshData={fetchFamily}
          userRole={userRole} /* Passing the role down to the modal! */
        />
      )}
    </div>
  );
}

export default App;