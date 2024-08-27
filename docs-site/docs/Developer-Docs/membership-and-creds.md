---
sidebar_position: 5
---

# Membership and Creds

The tgether platform provides a flexible way to manage membership and creds within a community. For developers, there is a mock contract in the repo setup as a **DEMO** for writing tests, it’s important to remember that any contract should be thoroughly audited before deploying to mainnet.

## memberAccess contracts: Invitations and Creds

- For more advanced membership control, a community can delegate membership management to a custom contract. This contract functions similarly to an owner in terms of inviting or uninviting members, but with an important distinction: once a cred access contract is in place, the owner no longer controls invites.

   > **Note:** If a community decides to delegate invites to a cred access contract, the owner cannot directly manage membership anymore. To regain control, you would need to propose a new set of parameters that resets the contract to `address(0)`.
```solidity 
    /* Logic for who can invite/uninvite a member */
        address credAddress = communityContract.getMemberAccessContract(_community);
        require((msg.sender == communityContract.getCommunityOwner(_community) && credAddress == address(0))|| msg.sender == communityContract.getMemberAccessContract(_community)  , "You dont have permission invite Members");
```
This flexibility makes cred access contracts a powerful tool for developers who want to create custom rules for managing membership. However, it’s important to understand that this feature is advanced and should be implemented with careful consideration of your community’s governance setup.

## Creds: Setting and Managing Creds

Creds play a critical role in determining a member’s influence within a community, affecting their ability to vote and participate in decision-making. In tgether, the default setup allows members to add or remove creds from others, but cred access contracts disables this default functionality. Instead, memberAccess contracts are able to set a member's cred count for their community.
 
Here’s an example of how creds are set using a custom contract:

```solidity
/* Setting internal in this example because you wouldn't want just anyone to set a member's cred count*/
function setMemberCred(address _memberAddress, int256 _creds) internal returns (int256) {
    int256 cred = communityMemberaddress.contractSetCred(communityName, _memberAddress, _creds);
    return cred;
}
```

It’s important to note that **cred access contracts can only set creds**—they cannot incrementally add or remove creds like the default system allows. This gives communities full control over defining how creds are calculated and applied.

### Getting and Adjusting a Member’s Creds

If you need to check the current creds of a member before making adjustments, you can do so by retrieving their creds and then applying your changes:

```solidity
int256 _currentCred = communityMemberAddress.getMemberCreds(_memberAddress, _community);
int256 _credAMT = _currentCred [ + or - ] xxxx;
int256 cred = communityMemberaddress.contractSetCred(communityName, _memberAddress, _credAMT);
```

This setup ensures that any changes made to a member’s creds are consistent with the community’s rules and governance structure.

---

By offering flexible membership management and advanced cred handling, tgether allows communities to design systems that fit their unique needs. Whether you’re using the default setup or customizing with cred access contracts, the power is in your hands to shape how your community operates.