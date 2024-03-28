import React, { useState, useEffect } from 'react';
import {
	Container,
	Form,
	Button,
	ListGroup,
	Card,
	Badge,
	Table,
	InputGroup,
	Row,
	Col,
} from 'react-bootstrap';
import axios from 'axios';

const RescueProfile = () => {
	const [rescueProfile, setRescueProfile] = useState({
		id: '',
		staff: [],
		rescueName: '',
		rescueType: '',
		rescueAddress: '',
		referenceNumber: '',
		referenceNumberVerified: false,
	});

	const userId = localStorage.getItem('userId');

	useEffect(() => {
		fetchRescueProfile();
	}, []);

	const fetchRescueProfile = async () => {
		try {
			// Assuming this URL is where you get your rescue profile data
			const response = await axios.get(
				`${import.meta.env.VITE_API_BASE_URL}/auth/my-rescue`,
				{
					withCredentials: true,
				}
			);

			setRescueProfile({
				...response.data,
				staff: response.data.staff || [],
			});
		} catch (error) {
			console.error('Error fetching rescue profile:', error);
		}
	};

	// Calculate unique permissions for table headers
	const uniquePermissions = Array.from(
		new Set(rescueProfile.staff.flatMap((staff) => staff.permissions))
	);

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

		console.log(staffId);
		console.log(rescueProfile);

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
			console.log('Permissions updated successfully:', response.data);
			// Optionally, you could fetch the updated rescue profile here to ensure the UI is fully in sync with the backend
			fetchRescueProfile();
		} catch (error) {
			console.error(
				'Error updating staff permissions:',
				error.response?.data || error.message
			);
		}
	};

	const handleRescueInfoChange = (e) => {
		const { name, value } = e.target;
		setRescueProfile((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleVerificationSubmit = (userId, verifiedByRescue) => {
		setRescueProfile((prev) => ({
			...prev,
			staff: prev.staff.map((staffMember) =>
				staffMember.userId._id === userId
					? { ...staffMember, verifiedByRescue: verifiedByRescue }
					: staffMember
			),
		}));
	};

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

	const updateRescueProfile = async (rescueId, updates) => {
		try {
			const response = await axios.put(
				`${import.meta.env.VITE_API_BASE_URL}/rescue/${rescueId}`,
				updates,
				{ withCredentials: true }
			);
			console.log('Rescue profile updated successfully:', response.data);
			// Optionally, refresh the local data to reflect the update
			fetchRescueProfile();
		} catch (error) {
			console.error(
				'Error updating rescue profile:',
				error.response?.data || error.message
			);
		}
	};

	const handleReferenceNumberSubmit = async () => {
		if (!rescueProfile.referenceNumber) {
			alert('Please enter a reference number to submit for verification.');
			return;
		}

		try {
			// Adjust the URL and request method according to your actual backend endpoint and its requirements
			const response = await axios.put(
				`${import.meta.env.VITE_API_BASE_URL}/rescue/${
					rescueProfile.id
				}/${rescueProfile.rescueType.toLowerCase()}/validate`,
				{ referenceNumber: rescueProfile.referenceNumber.trim() }, // Or send as query params as per your API
				{ withCredentials: true }
			);

			if (response.data.verified) {
				setRescueProfile((prev) => ({
					...prev,
					referenceNumberVerified: true,
				}));
				alert('Reference number verified successfully.');
			} else {
				setRescueProfile((prev) => ({
					...prev,
					referenceNumberVerified: false,
				}));
				alert('Failed to verify reference number.');
			}
		} catch (error) {
			console.error(
				'Error submitting reference number for verification:',
				error
			);
			alert(
				'Error submitting reference number for verification. Please try again later.'
			);
		}
	};

	// Updated handleRemoveStaff to use the new API call
	const handleRemoveStaff = (staffId) => {
		removeStaffMember(rescueProfile.id, staffId);
	};

	// Assuming each staff member's verification status can be toggled with a button in your UI
	const handleVerifyStaff = (staffId) => {
		verifyStaffMember(rescueProfile.id, staffId);
	};

	const saveUpdates = () => {
		// Assuming `rescueProfile` contains the updated rescue profile data
		updateRescueProfile(rescueProfile.id, rescueProfile);
	};

	return (
		<Container fluid>
			<h1>
				Rescue Profile{' '}
				<span style={{ verticalAlign: 'top' }}>
					<Badge
						bg={rescueProfile.referenceNumberVerified ? 'success' : 'danger'}
						style={{ fontSize: '16px' }}
					>
						{rescueProfile.referenceNumberVerified ? 'Verified' : 'Un-verified'}
					</Badge>
				</span>{' '}
				<span style={{ verticalAlign: 'top' }} bg='light'>
					<Badge style={{ fontSize: '16px' }}>{rescueProfile.id}</Badge>
				</span>
			</h1>

			<Form>
				<Row>
					{/* Rescue Name */}
					<Col md={4}>
						<Form.Group className='mb-3'>
							<Form.Label>Rescue Name</Form.Label>
							<Form.Control
								type='text'
								name='rescueName'
								value={rescueProfile.rescueName}
								onChange={handleRescueInfoChange}
							/>
						</Form.Group>
					</Col>

					{/* Rescue Type */}
					<Col md={4}>
						<Form.Group className='mb-3'>
							<Form.Label>Rescue Type</Form.Label>
							<Form.Control
								type='text'
								name='rescueType'
								value={rescueProfile.rescueType}
								disabled={true}
							/>
						</Form.Group>
					</Col>

					{/* Reference Number */}
					<Col md={4}>
						<Form.Group className='mb-3'>
							<Form.Label>Reference Number</Form.Label>
							<InputGroup>
								<Form.Control
									type='text'
									placeholder='Enter reference number'
									aria-label='Reference Number'
									name='referenceNumber'
									value={rescueProfile.referenceNumber || ''}
									onChange={handleRescueInfoChange}
								/>
								<Button
									variant='outline-secondary'
									id='button-addon2'
									onClick={handleReferenceNumberSubmit}
								>
									Submit for verification
								</Button>
							</InputGroup>
						</Form.Group>
					</Col>
				</Row>

				{/* Rescue Address - As it's own section for clarity and spacing */}
				<Form.Group className='mb-3'>
					<Form.Label>Rescue Address</Form.Label>
					<Form.Control
						type='text'
						name='rescueAddress'
						value={rescueProfile.rescueAddress || ''}
						onChange={handleRescueInfoChange}
					/>
				</Form.Group>
			</Form>

			<Button variant='primary' className='mt-3' onClick={saveUpdates}>
				Save Changes
			</Button>

			<hr />

			<h2>Staff Members</h2>
			<Table striped bordered hover>
				<thead>
					<tr>
						<th>Staff Email</th>
						{uniquePermissions.map((permission, index) => (
							<th key={index}>{permission}</th>
						))}
						<th>Actions</th>{' '}
						{/* This header accommodates both verify and remove actions */}
					</tr>
				</thead>
				<tbody>
					{rescueProfile.staff.map((staff) => (
						<tr key={staff.userId._id}>
							<td>{staff.userId.email}</td>
							{uniquePermissions.map((permission) => (
								<>
									<td key={permission}>
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
											disabled={staff.userId._id === userId} // Disable if this staff is the current user
										/>
									</td>
								</>
							))}

							<td>
								{staff.verifiedByRescue ? (
									<Button variant='info' disabled={true}>
										Verified
									</Button>
								) : (
									<Button
										variant='warning'
										onClick={() => handleVerifyStaff(staff.userId._id)}
									>
										Verify Staff
									</Button>
								)}
							</td>
							<td>
								<Button
									variant='danger'
									onClick={() => handleRemoveStaff(staff.userId._id)}
								>
									Remove Staff
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</Table>
		</Container>
	);
};

export default RescueProfile;