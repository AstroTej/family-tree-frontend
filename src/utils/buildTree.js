export const buildTree = (flatData, centerId = null, viewMode = 'focus') => {
  if (!flatData || flatData.length === 0) return null;

  const calculateAge = (dobString, dodString) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const endDate = dodString ? new Date(dodString) : new Date();
    let age = endDate.getFullYear() - birthDate.getFullYear();
    const m = endDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const getSpouse = (person) => person?.spouse ? flatData.find(p => p._id === (person.spouse._id || person.spouse)) : null;

  const sortChronologically = (a, b) => {
    if (a.dateOfBirth && b.dateOfBirth) return new Date(a.dateOfBirth) - new Date(b.dateOfBirth);
    if (a.dateOfBirth) return -1;
    if (b.dateOfBirth) return 1;
    return 0;
  };

  let centerPerson = centerId ? flatData.find(p => p._id === centerId) : flatData[0];
  if (!centerPerson) return null;

  // --- 1. FULL TREE VIEW ---
  if (viewMode === 'full') {
    const buildNode = (person, visited = new Set()) => {
      if (visited.has(person._id)) return null; 
      visited.add(person._id);

      const spouse = getSpouse(person);
      const node = {
        name: `${person.firstName} ${person.lastName}`,
        attributes: {
          id: person._id,
          gender: person.gender,
          isDeceased: !!person.dateOfDeath,
          age: calculateAge(person.dateOfBirth, person.dateOfDeath),
          spouseId: spouse ? spouse._id : null,
          spouseName: spouse ? `${spouse.firstName} ${spouse.lastName}` : '',
          spouseGender: spouse ? spouse.gender : '',
          spouseIsDeceased: spouse ? !!spouse.dateOfDeath : false,
          spouseAge: spouse ? calculateAge(spouse.dateOfBirth, spouse.dateOfDeath) : '',
          isCenter: person._id === centerId, 
          label: '',
          spouseLabel: '',
          location: person.location || '',
          postMaritalName: person.postMaritalName || '',
          spouseLocation: spouse ? spouse.location : '',
          spousePostMaritalName: spouse ? spouse.postMaritalName : ''
        },
        children: []
      };

      const children = flatData
        .filter(p => (p.father && (p.father._id === person._id || p.father === person._id)) || (p.mother && (p.mother._id === person._id || p.mother === person._id)))
        .sort(sortChronologically);

      children.forEach(child => {
        const childNode = buildNode(child, new Set(visited)); 
        if (childNode) node.children.push(childNode);
      });

      return node;
    };

    return buildNode(centerPerson);
  }

  // --- FOCUS VIEW ---
  const centerSpouse = getSpouse(centerPerson);

  // 2. CENTER NODE
  const centerNode = {
    name: `${centerPerson.firstName} ${centerPerson.lastName}`,
    attributes: {
      id: centerPerson._id,
      gender: centerPerson.gender,
      isDeceased: !!centerPerson.dateOfDeath,
      age: calculateAge(centerPerson.dateOfBirth, centerPerson.dateOfDeath),
      spouseId: centerSpouse ? centerSpouse._id : null,
      spouseName: centerSpouse ? `${centerSpouse.firstName} ${centerSpouse.lastName}` : '',
      spouseGender: centerSpouse ? centerSpouse.gender : '',
      spouseIsDeceased: centerSpouse ? !!centerSpouse.dateOfDeath : false,
      spouseAge: centerSpouse ? calculateAge(centerSpouse.dateOfBirth, centerSpouse.dateOfDeath) : '',
      isCenter: true,
      label: '', 
      spouseLabel: '',
      location: centerPerson.location || '',
      postMaritalName: centerPerson.postMaritalName || '',
      spouseLocation: centerSpouse ? centerSpouse.location : '',
      spousePostMaritalName: centerSpouse ? centerSpouse.postMaritalName : ''
    },
    children: []
  };

  const children = flatData
    .filter(p => (p.father && (p.father._id === centerPerson._id || p.father === centerPerson._id)) || (p.mother && (p.mother._id === centerPerson._id || p.mother === centerPerson._id)))
    .sort(sortChronologically);

  // 3. CHILDREN NODES
  children.forEach(child => {
    const childSpouse = getSpouse(child);
    centerNode.children.push({
      name: `${child.firstName} ${child.lastName}`,
      attributes: {
        id: child._id,
        gender: child.gender,
        isDeceased: !!child.dateOfDeath,
        age: calculateAge(child.dateOfBirth, child.dateOfDeath),
        spouseId: childSpouse ? childSpouse._id : null,
        spouseName: childSpouse ? `${childSpouse.firstName} ${childSpouse.lastName}` : '',
        spouseGender: childSpouse ? childSpouse.gender : '',
        spouseIsDeceased: childSpouse ? !!childSpouse.dateOfDeath : false,
        spouseAge: childSpouse ? calculateAge(childSpouse.dateOfBirth, childSpouse.dateOfDeath) : '',
        isCenter: false,
        label: '',
        spouseLabel: '',
        location: child.location || '',
        postMaritalName: child.postMaritalName || '',
        spouseLocation: childSpouse ? childSpouse.location : '',
        spousePostMaritalName: childSpouse ? childSpouse.postMaritalName : ''
      },
      children: [] 
    });
  });

  const father = centerPerson.father ? flatData.find(p => p._id === (centerPerson.father._id || centerPerson.father)) : null;
  const mother = centerPerson.mother ? flatData.find(p => p._id === (centerPerson.mother._id || centerPerson.mother)) : null;

  if (father || mother) {
    const primaryParent = father || mother;
    const primarySpouse = getSpouse(primaryParent);

    let pLabel = '';
    let sLabel = '';

    if (primaryParent._id === father?._id) {
        pLabel = `Father of ${centerPerson.firstName}`;
        if (primarySpouse && mother && primarySpouse._id === mother._id) {
            sLabel = `Mother of ${centerPerson.firstName}`;
        } else if (primarySpouse) {
            sLabel = `Spouse of ${primaryParent.firstName}`;
        }
    } else {
        pLabel = `Mother of ${centerPerson.firstName}`;
        if (primarySpouse && father && primarySpouse._id === father._id) {
            sLabel = `Father of ${centerPerson.firstName}`;
        } else if (primarySpouse) {
            sLabel = `Spouse of ${primaryParent.firstName}`;
        }
    }

    // 4. PARENTS NODE
    const parentsNode = {
      name: `${primaryParent.firstName} ${primaryParent.lastName}`,
      attributes: {
        id: primaryParent._id,
        gender: primaryParent.gender,
        isDeceased: !!primaryParent.dateOfDeath,
        age: calculateAge(primaryParent.dateOfBirth, primaryParent.dateOfDeath),
        spouseId: primarySpouse ? primarySpouse._id : null,
        spouseName: primarySpouse ? `${primarySpouse.firstName} ${primarySpouse.lastName}` : '',
        spouseGender: primarySpouse ? primarySpouse.gender : '',
        spouseIsDeceased: primarySpouse ? !!primarySpouse.dateOfDeath : false,
        spouseAge: primarySpouse ? calculateAge(primarySpouse.dateOfBirth, primarySpouse.dateOfDeath) : '',
        isCenter: false,
        label: pLabel,
        spouseLabel: sLabel,
        location: primaryParent.location || '',
        postMaritalName: primaryParent.postMaritalName || '',
        spouseLocation: primarySpouse ? primarySpouse.location : '',
        spousePostMaritalName: primarySpouse ? primarySpouse.postMaritalName : ''
      },
      children: [centerNode] 
    };
    return parentsNode;
  }

  return centerNode;
};
