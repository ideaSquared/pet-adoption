import React, { useState } from 'react';
import { useFilteredStaff } from '../../hooks/useFilteredStaff';
import StaffTable from '../../components/tables/StaffTable';
import AddStaffSidebar from '../../components/sidebars/AddStaffSidebar';
import { Rescue } from '../../types/rescue';
import { StaffService } from '../../services/StaffService';

interface StaffProps {
	rescueProfile: Rescue | null;
	setRescueProfile: React.Dispatch<React.SetStateAction<Rescue | null>>;
	currentUserId: string;
}

const Staff: React.FC<StaffProps> = ({
	rescueProfile,
	setRescueProfile,
	currentUserId,
}) => {
	const [showAddStaffSidebar, setShowAddStaffSidebar] = useState(false);

	if (!rescueProfile) {
		return <p>Rescue profile not available.</p>;
	}

	const {
		filteredStaff,
		isLoading,
		error,
		filterCriteria,
		handleFilterChange,
		refreshStaff,
	} = useFilteredStaff(rescueProfile.rescue_id);

	const currentUserPermissions = rescueProfile.staff.find(
		(staff) => staff.user_id === currentUserId
	)?.permissions;

	const canAddStaff = currentUserPermissions?.includes('add_staff') || false;

	const handleVerifyStaff = async (userId: string) => {
		try {
			await StaffService.verifyStaffMember(rescueProfile.rescue_id, userId);
			console.log('Verified staff member:', userId);
			refreshStaff();
		} catch (err) {
			console.error('Failed to verify staff member', err);
		}
	};

	const handleRemoveStaff = async (userId: string) => {
		try {
			await StaffService.removeStaffMember(rescueProfile.rescue_id, userId);
			console.log('Removed staff member:', userId);
			refreshStaff();
		} catch (err) {
			console.error('Failed to remove staff member', err);
		}
	};

	const handleUpdatePermissions = async (
		userId: string,
		permission: string,
		value: boolean
	) => {
		try {
			const staffMember = filteredStaff.find(
				(staff) => staff.user_id === userId
			);
			if (!staffMember) return;

			const updatedPermissions = value
				? [...(staffMember.permissions || []), permission]
				: (staffMember.permissions || []).filter((p) => p !== permission);

			await StaffService.updateStaffPermissions(
				rescueProfile.rescue_id,
				userId,
				updatedPermissions
			);
			console.log('Updated permissions for:', userId);
			refreshStaff();
		} catch (err) {
			console.error('Failed to update permissions', err);
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

	return (
		<div>
			<h2 className='text-xl mb-4'>Staff</h2>
			{isLoading ? (
				<p>Loading...</p>
			) : error ? (
				<p>Error: {error.message}</p>
			) : (
				<>
					<div className='flex flex-wrap gap-4 mb-3 items-center'>
						<div className='flex-1 min-w-[150px] flex flex-col space-y-2'>
							<input
								type='text'
								placeholder='Search by name or email'
								value={filterCriteria.nameEmail}
								onChange={handleFilterChange('nameEmail')}
								className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
							/>
						</div>
						<div className='flex-1 min-w-[150px] flex flex-col space-y-2'>
							<select
								value={filterCriteria.permissions}
								onChange={handleFilterChange('permissions')}
								className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
							>
								<option value='all'>Filter by all permissions</option>
								{Array.from(
									new Set(
										filteredStaff.flatMap(
											(staffMember) => staffMember.permissions || []
										)
									)
								).map((perm) => (
									<option key={perm} value={perm}>
										{perm}
									</option>
								))}
							</select>
						</div>
						<div className='flex-1 min-w-[150px] flex items-center space-x-2'>
							<label
								htmlFor='verified-switch'
								className='text-sm font-medium text-gray-700'
							>
								Verified Only
							</label>
							<input
								type='checkbox'
								id='verified-switch'
								name='verified'
								checked={filterCriteria.verified}
								onChange={handleFilterChange('verified')}
								className='form-checkbox h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500'
							/>
						</div>
						{canAddStaff && (
							<div className='flex-1 min-w-[150px] flex justify-end'>
								<button
									onClick={() => setShowAddStaffSidebar(true)}
									className='inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
								>
									Add
								</button>
							</div>
						)}
					</div>
					<StaffTable
						staff={filteredStaff}
						verifyStaff={handleVerifyStaff}
						removeStaff={handleRemoveStaff}
						updatePermissions={handleUpdatePermissions}
						canEdit={true}
						permissionCategories={permissionCategories}
						permissionNames={permissionNames}
						user_id={rescueProfile.rescue_id}
					/>
				</>
			)}
			<AddStaffSidebar
				show={showAddStaffSidebar}
				handleClose={() => setShowAddStaffSidebar(false)}
				setRescueProfile={setRescueProfile}
				rescueId={rescueProfile.rescue_id}
				canAddStaff={canAddStaff}
				refreshStaff={refreshStaff} // Pass refreshStaff function as prop
			/>
		</div>
	);
};

export default Staff;
