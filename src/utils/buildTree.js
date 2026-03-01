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

  // --- NEW: Sibling Sorting Logic ---
  const sortChronologically = (a, b) => {
    // If both have birth dates, oldest goes left (smaller date value)
    if (a.dateOfBirth && b.dateOfBirth) {
      return new Date(a.dateOfBirth) - new Date(b.dateOfBirth);
    }
    // If only one has a birth date, they get priority to the left
    if (a.dateOfBirth) return -1;
    if (b.dateOfBirth) return 1;
    // If neither has a birth date, leave them as they are
    return 0;
  };

  let centerPerson = centerId ? flatData.find(p => p._id === centerId) : flatData[0];
  if (!centerPerson) return null;

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
          spouseLabel: ''
        },
        children: []
      };

      // Filter children, then apply our chronological sort!
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

  const centerSpouse = getSpouse(centerPerson);

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
      spouseLabel: '' 
    },
    children: []
  };

  // Filter children, then apply our chronological sort!
  const children = flatData
    .filter(p => (p.father && (p.father._id === centerPerson._id || p.father === centerPerson._id)) || (p.mother && (p.mother._id === centerPerson._id || p.mother === centerPerson._id)))
    .sort(sortChronologically);

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
        spouseLabel: ''
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
        spouseLabel: sLabel 
      },
      children: [centerNode] 
    };
    return parentsNode;
  }

  return centerNode;
};