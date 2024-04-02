import React, { useState } from 'react';
import {
	Table,
	Button,
	Modal,
	Tabs,
	Tab,
	Form,
	Container,
	Row,
	Col,
} from 'react-bootstrap';
import PaginationControls from '../../components/common/PaginationControls';
import AlertComponent from '../../components/common/AlertComponent';
import axios from 'axios';

const RescueStaffManagement = ({
	rescueProfile,
	setRescueProfile,
	fetchRescueProfile,
	canAddStaff,
	canEditStaff,
	canVerifyStaff,
	canDeleteStaff,
	uniquePermissions,
	userId,
}) => {
	const [tabState, setTabState] = useState('');

	// NEW
	const [showAddStaffModal, setShowAddStaffModal] = useState(false);
	const [newStaff, setNewStaff] = useState({
		firstName: '',
		email: '',
		password: '',
	});
	const [existingStaffEmail, setExistingStaffEmail] = useState('');

	const [currentPage, setCurrentPage] = useState(1);
	const [staffPerPage] = useState(10);

	const indexOfLastStaff = currentPage * staffPerPage;
	const indexOfFirstStaff = indexOfLastStaff - staffPerPage;
	const currentStaff = rescueProfile.staff.slice(
		indexOfFirstStaff,
		indexOfLastStaff
	);
	const totalPages = Math.ceil(rescueProfile.staff.length / staffPerPage);

	const verifyStaffMember = async (rescueId, staffId) => {
		try {
			const response = await axios.put(
				`${
					import.meta.env.VITE_API_BASE_URL
				}/rescue/${rescueId}/staff/${staffId}/verify`,
				{}, // PUT request does not need a body for this operation
				{ withCredentials: true }
			);

			// Reload or update the rescue profile to reflect the changes
			fetchRescueProfile();
		} catch (error) {
			console.error(
				'Error verifying staff member:',
				error.response?.data || error.message
			);
		}
	};

	const removeStaffMember = async (rescueId, staffId) => {
		const isConfirmed = window.confirm(
			'Are you sure you want to delete this staff member?'
		);
		if (!isConfirmed) {
			return; // Stop the function if the user cancels the action
		}

		try {
			const response = await axios.delete(
				`${
					import.meta.env.VITE_API_BASE_URL
				}/rescue/${rescueId}/staff/${staffId}`,
				{ withCredentials: true }
			);
			// Reload or update the rescue profile to reflect the changes
			fetchRescueProfile();
		} catch (error) {
			console.error(
				'Error removing staff member:',
				error.response?.data || error.message
			);
		}
	};

	const handleAddStaff = async (staffInfo) => {
		try {
			// Construct the payload based on the provided staff information
			const payload =
				staffInfo.firstName && staffInfo.password
					? {
							// Adding a new staff member
							firstName: staffInfo.firstName,
							email: staffInfo.email,
							password: staffInfo.password,
					  }
					: {
							// Adding an existing user as staff
							email: staffInfo.email,
					  };

			// API call to add a staff member (new or existing)
			const response = await axios.post(
				`${import.meta.env.VITE_API_BASE_URL}/rescue/${rescueProfile.id}/staff`,
				payload,
				{
					withCredentials: true,
				}
			);

			// Actions upon successful addition
			setShowAddStaffModal(false); // Close the modal
			fetchRescueProfile(); // Refresh the staff list

			// Reset state based on the type of addition
			if (payload.firstName) {
				setNewStaff({ firstName: '', email: '', password: '' }); // Reset for new user
			} else {
				setExistingStaffEmail(''); // Reset for existing user
			}
		} catch (error) {
			console.error(
				'Error adding staff member:',
				error.response?.data || error.message
			);
		}
	};

	// Function to handle adding a new staff member
	const handleAddNewStaff = () => {
		const staffInfo = { ...newStaff }; // Copy newStaff state
		handleAddStaff(staffInfo); // Pass the new staff info to the generic handler
		setNewStaff({ firstName: '', email: '', password: '' }); // Reset new staff form
	};

	// Function to handle adding an existing staff member
	const handleAddExistingUserToStaff = () => {
		handleAddStaff({ email: existingStaffEmail }); // Call with only the email for existing user
	};

	// Updated handleRemoveStaff to use the new API call
	const handleRemoveStaff = (staffId) => {
		removeStaffMember(rescueProfile.id, staffId);
	};

	// Assuming each staff member's verification status can be toggled with a button in your UI
	const handleVerifyStaff = (staffId) => {
		verifyStaffMember(rescueProfile.id, staffId);
	};

	const handlePermissionChange = async (staffId, permission, isChecked) => {
		// Update local state first for immediate feedback
		setRescueProfile((prevState) => {
			const updatedStaff = prevState.staff.map((staff) => {
				if (staff.userId === staffId) {
					const updatedPermissions = isChecked
						? [...staff.permissions, permission]
						: staff.permissions.filter((p) => p !== permission);

					return {
						...staff,
						permissions: updatedPermissions,
					};
				}
				return staff;
			});

			return {
				...prevState,
				staff: updatedStaff,
			};
		});

		// Prepare the data for updating the backend
		const updatedPermissions = rescueProfile.staff.find(
			(s) => s.userId._id === staffId
		).permissions;
		if (isChecked && !updatedPermissions.includes(permission)) {
			updatedPermissions.push(permission);
		} else if (!isChecked) {
			const index = updatedPermissions.indexOf(permission);
			if (index > -1) {
				updatedPermissions.splice(index, 1); // Remove permission if unchecked
			}
		}

		// Send an update request to the backend
		try {
			const response = await axios.put(
				`${import.meta.env.VITE_API_BASE_URL}/rescue/${
					rescueProfile.id
				}/staff/${staffId}/permissions`,
				{
					permissions: updatedPermissions,
				},
				{
					withCredentials: true,
				}
			);
			// console.log('Permissions updated successfully:', response.data);
			// Optionally, you could fetch the updated rescue profile here to ensure the UI is fully in sync with the backend
			fetchRescueProfile();
		} catch (error) {
			console.error(
				'Error updating staff permissions:',
				error.response?.data || error.message
			);
		}
	};

	const permissionCategories = {
		rescueOperations: ['view_rescue_info', 'edit_rescue_info', 'delete_rescue'],
		staffManagement: [
			'view_staff',
			'add_staff',
			'edit_staff',
			'verify_staff',
			'delete_staff',
		],
		petManagement: ['view_pet', 'add_pet', 'edit_pet', 'delete_pet'],
		communications: ['create_messages', 'view_messages'],
	};

	const permissionNames = {
		view_rescue_info: 'View Rescue Information',
		edit_rescue_info: 'Edit Rescue Information',
		delete_rescue: 'Delete Rescue',
		view_staff: 'View Staff',
		add_staff: 'Add Staff',
		edit_staff: 'Edit Staff Information',
		verify_staff: 'Verify Staff',
		delete_staff: 'Delete Staff',
		view_pet: 'View Pet',
		add_pet: 'Add Pet',
		edit_pet: 'Edit Pet Information',
		delete_pet: 'Delete Pet',
		create_messages: 'Create Messages',
		view_messages: 'View Messages',
	};

	const [searchTerm, setSearchTerm] = useState('');
	const [filterPermissions, setFilterPermissions] = useState([]);
	const [filterVerified, setFilterVerified] = useState(false); // Initially set to false to show all staff members

	// Example filter logic applied to your currentStaff calculation
	const filteredStaff = rescueProfile.staff.filter(
		(staff) =>
			staff.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
			filterPermissions.every((permission) =>
				staff.permissions.includes(permission)
			) &&
			(filterVerified ? staff.verifiedByRescue : true)
	);

	return (
		<div>
			<h2>Staff members</h2>
			<Container>
				<Row className='align-items-end mb-3'>
					<Col sm={6} md={12}>
						<Form.Control
							type='text'
							placeholder='Search staff by name or email...'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</Col>
					<Col sm={6} md={3}>
						<Form.Label>Sort By:</Form.Label>
						<Form.Select
							aria-label='Sort By'
							onChange={(e) => setSortCriteria(JSON.parse(e.target.value))}
						>
							<option value={JSON.stringify({ field: '', direction: '' })}>
								None
							</option>
							<option
								value={JSON.stringify({ field: 'name', direction: 'asc' })}
							>
								Name Ascending
							</option>
							<option
								value={JSON.stringify({ field: 'name', direction: 'desc' })}
							>
								Name Descending
							</option>
							{/* Add other sorting criteria as needed */}
						</Form.Select>
					</Col>
					<Col sm={6} md={3}>
						<Form.Group>
							<Form.Label>Permissions Filter:</Form.Label>
							<Form.Select
								aria-label='Permissions Filter'
								value={filterPermissions}
								onChange={(e) => {
									const selectedOptions = Array.from(
										e.target.selectedOptions,
										(option) => option.value
									);
									setFilterPermissions(selectedOptions);
								}}
							>
								{Object.keys(permissionCategories).map((category) =>
									permissionCategories[category].map((permission, index) => (
										<option key={index} value={permission}>
											{permissionNames[permission] || 'Unknown Permission'}{' '}
										</option>
									))
								)}
							</Form.Select>
						</Form.Group>
					</Col>
					<Col sm={6} md={3}>
						<Form.Group>
							<Form.Label>Verified Toggle:</Form.Label>
							<div>
								<Form.Check
									type='switch'
									id='verifiedToggle'
									label='Show Only Verified'
									checked={filterVerified} // This state should be a boolean indicating if the filter is active
									onChange={(e) => setFilterVerified(e.target.checked)} // Handler to update the state
								/>
							</div>
						</Form.Group>
					</Col>

					<Col md={3}>
						<Button
							variant='primary'
							onClick={() => setShowAddStaffModal(true)}
							disabled={!canAddStaff}
							className='w-100'
						>
							Add Staff
						</Button>
					</Col>
				</Row>
			</Container>
			<Table striped bordered hover responsive>
				<thead>
					<tr>
						<th rowSpan='2'>Staff Email</th>
						<th colSpan='3'>Rescue Operations</th>
						<th colSpan='5'>Staff Management</th>
						<th colSpan='4'>Pet Management</th>
						<th colSpan='2'>Communications</th>
						<th rowSpan='2'>Actions</th>
					</tr>
					<tr>
						<th>View Rescue Info</th>
						<th>Edit Rescue Info</th>
						<th>Delete Rescue</th>

						<th>View Staff</th>
						<th>Add Staff</th>
						<th>Edit Staff</th>
						<th>Verify Staff</th>
						<th>Delete Staff</th>

						<th>View Pet</th>
						<th>Add Pet</th>
						<th>Edit Pet</th>
						<th>Delete Pet</th>

						<th>Create Messages</th>
						<th>Read Messages</th>
					</tr>
				</thead>
				<tbody>
					{filteredStaff.map((staff) => (
						<tr key={staff.userId._id}>
							<td>{staff.userId.email}</td>

							{Object.keys(permissionCategories).map((category) =>
								permissionCategories[category].map((permission) => (
									<td key={`${staff.userId._id}-${permission}`}>
										<Form.Check
											type='checkbox'
											checked={staff.permissions.includes(permission)}
											onChange={(e) =>
												handlePermissionChange(
													staff.userId._id,
													permission,
													e.target.checked
												)
											}
											disabled={staff.userId._id === userId || !canEditStaff}
										/>
									</td>
								))
							)}

							<td>
								{staff.verifiedByRescue ? (
									<Button variant='info' disabled={true}>
										Verified
									</Button>
								) : (
									<Button
										variant='warning'
										onClick={() => handleVerifyStaff(staff.userId._id)}
										disabled={!canVerifyStaff}
									>
										Verify staff
									</Button>
								)}{' '}
								<Button
									variant='danger'
									onClick={() => handleRemoveStaff(staff.userId._id)}
									disabled={!canDeleteStaff}
								>
									Remove staff
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</Table>

			<PaginationControls
				currentPage={currentPage}
				totalPages={totalPages}
				onChangePage={setCurrentPage}
			/>
			<Modal
				show={showAddStaffModal}
				onHide={() => setShowAddStaffModal(false)}
			>
				<Modal.Header closeButton>
					<Modal.Title>Add New Staff Member</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Tabs
						defaultActiveKey='newUser'
						id='addUserTab'
						onSelect={(key) => setTabState(key)}
					>
						<Tab eventKey='newUser' title='Add a New User'>
							<AlertComponent
								type={'info'}
								message={'This will create a new user who will need to login'}
								hideCloseButton={true}
							/>
							<Form>
								<Form.Group className='mb-3'>
									<Form.Label>First name</Form.Label>
									<Form.Control
										type='text'
										placeholder='Enter first name'
										value={newStaff.firstName}
										onChange={(e) =>
											setNewStaff({
												...newStaff,
												firstName: e.target.value,
											})
										}
									/>
								</Form.Group>
								<Form.Group className='mb-3'>
									<Form.Label>Email address</Form.Label>
									<Form.Control
										type='email'
										placeholder='Enter email'
										value={newStaff.email}
										onChange={(e) =>
											setNewStaff({ ...newStaff, email: e.target.value })
										}
									/>
								</Form.Group>
								<Form.Group className='mb-3'>
									<Form.Label>Password</Form.Label>
									<Form.Control
										type='password'
										placeholder='Password'
										value={newStaff.password}
										onChange={(e) =>
											setNewStaff({ ...newStaff, password: e.target.value })
										}
									/>
								</Form.Group>
							</Form>
						</Tab>
						<Tab eventKey='existingUser' title='Add an Existing User'>
							<AlertComponent
								type={'info'}
								message={'This will add an already signed up user as staff'}
								hideCloseButton={true}
							/>
							<Form>
								<Form.Group className='mb-3'>
									<Form.Label>Email address</Form.Label>
									<Form.Control
										type='email'
										placeholder='Enter existing user email'
										value={existingStaffEmail}
										onChange={(e) => setExistingStaffEmail(e.target.value)}
									/>
								</Form.Group>
							</Form>
						</Tab>
					</Tabs>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant='secondary'
						onClick={() => setShowAddStaffModal(false)}
					>
						Close
					</Button>
					<Button
						variant='primary'
						onClick={() => {
							// Assuming you have a way to determine which tab is active, e.g., using a state
							if (tabState === 'newUser') {
								handleAddNewStaff(); // Call function to add new staff
							} else if (tabState === 'existingUser') {
								handleAddExistingUserToStaff(); // Call function to add existing staff
							}
						}}
						disabled={!canAddStaff}
					>
						Add staff
					</Button>
				</Modal.Footer>
			</Modal>
		</div>
	);
};

export default RescueStaffManagement;